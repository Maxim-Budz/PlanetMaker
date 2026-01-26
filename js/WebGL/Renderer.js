import Sphere from '../Shape/Sphere.js';
import RenderPass from '../Constants/RenderPass.js';

const { mat3, mat4, vec3, vec4 } = glMatrix;
//TODO change skybox rendering to cubemap...
export default class Renderer {
    constructor(gl) {
		
		this.drawCalls = 0;
        this.gl = gl;
		this.shaderManager = null;

		this.model = glMatrix.mat4.create();
        this.view = glMatrix.mat4.create();
        this.proj = glMatrix.mat4.create();	
		
		this.currentScene = null;

		this.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, this.aspect, 0.1, 10000.0);
        mat4.lookAt(this.view, [10,-16,10], [0, 0, 0], [0, 1, 0]);


		this.normalMatrix = mat3.create();
		mat3.fromMat4(this.normalMatrix, this.model);
		mat3.invert(this.normalMatrix, this.normalMatrix);
		mat3.transpose(this.normalMatrix, this.normalMatrix);

		this.renderQueues = {
			[RenderPass.SKYBOX]: new Map(),
			[RenderPass.VFX]: new Map(),
			[RenderPass.GEOMETRY]: new Map()
		};


    }

//every model located in scene will be put in the correct queue
	submit(pass, shaderName, shape) {

		const queue = this.renderQueues[pass];

		if (!queue) console.error(shaderName, shape);

		if (!queue.has(shaderName))
			queue.set(shaderName, []);

		queue.get(shaderName).push(shape);
	}


	//loads the global values that is the same for all objects.
	setFrameUniforms(shaderName) {


		this.shaderManager.apply(shaderName, "uProj",  this.proj);
		this.shaderManager.apply(shaderName, "uView",  this.view);
		this.shaderManager.apply(shaderName, "uCamPos", this.currentScene.camPos);
		this.shaderManager.apply(shaderName, "uTime", performance.now() * 0.001);
		this.shaderManager.apply(shaderName, "uNormal", this.normalMatrix);
		this.shaderManager.apply(shaderName, "uAmbient", this.currentScene.ambient);

		this.shaderManager.apply(shaderName, "uNumLights", this.currentScene.pointLights.length);
		this.shaderManager.apply(shaderName, "uPointLightPositions",new Float32Array(this.currentScene.lightPositions)); 
		this.shaderManager.apply(shaderName, "uPointLightColors",new Float32Array(this.currentScene.lightColors)); 
		this.shaderManager.apply(shaderName, "uPointLightIntensities",new Float32Array(this.currentScene.lightIntensities)); 
		this.shaderManager.apply(shaderName, "uPointLightDistances",new Float32Array(this.currentScene.lightDistances));

	}

//Functions to render
	//
		//TODO: Bug involving order of drawing stuff. We need to draw the furthest away stuff first that is in the frustrum.

	beginFrame(){
		const gl = this.gl;
		//clear the queues
		for (const pass in this.renderQueues)
			this.renderQueues[pass].clear();
		this.drawCalls = 0;

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		gl.depthMask(true);

		gl.disable(gl.BLEND);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		

		gl.clearColor(0,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		this.extractFrustumPlanes();
	}

	render(elapsed, selectedID){
		if(! this.currentScene) return;
		const gl = this.gl;

		let t = performance.now() * 0.001;
		let theta = t * this.currentScene.camSpeed;
		let phi = 0.6;
		const radius = Math.max(this.currentScene.camHeight, 1.0);
		let camX = radius * Math.cos(phi) * Math.cos(theta);
		let camZ = radius * Math.cos(phi) * Math.sin(theta);
		let camY = radius * Math.sin(phi);

		this.currentScene.camPos = [this.currentScene.focusPoint[0] + camX, this.currentScene.focusPoint[1] + camY, this.currentScene.focusPoint[2] + camZ];

		glMatrix.mat4.lookAt(this.view, this.currentScene.camPos, this.currentScene.focusPoint, [0, 1, 0] );


		this.drawPass(RenderPass.SKYBOX, elapsed, selectedID);
		this.drawPass(RenderPass.VFX, elapsed, selectedID);
		this.drawPass(RenderPass.GEOMETRY, elapsed, selectedID);
		

	}

	drawPass(pass, elapsed, selectedID) {

		const gl = this.gl;

		const queue = this.renderQueues[pass];


		switch (pass) {

			case RenderPass.SKYBOX:
				gl.depthMask(false);
				gl.depthFunc(gl.LEQUAL);
				gl.disable(gl.CULL_FACE);
				break;

			case RenderPass.VFX:
				gl.enable(gl.BLEND);
				gl.enable(gl.CULL_FACE);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				gl.disable(gl.DEPTH_TEST);
				gl.depthMask(false);

				break;

			case RenderPass.GEOMETRY:
				gl.disable(gl.BLEND);
				gl.depthMask(true);
				gl.depthFunc(gl.LESS);
				gl.enable(gl.CULL_FACE);
				gl.enable(gl.DEPTH_TEST);
				gl.depthMask(true);
				break;
		}


		for (const [shaderName, shapes] of queue) {

			gl.useProgram(this.shaderManager.programs[shaderName].program);			
			this.setFrameUniforms(shaderName);

			for (const shape of shapes) {

				// Selection transparency TODO, later I will just make a new shader for selected
				this.shaderManager.apply(
					shaderName,
					"uTransparency",
					shape.id === selectedID ? 0.4 : 1.0
				);

				// Per-shape uniforms
				this.shaderManager.applyShapeUniforms(shape);

				gl.bindVertexArray(shape.vao);

				if (shape.texture instanceof WebGLTexture) {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, shape.texture);
					this.shaderManager.apply(shaderName, "uTexture", 0);
				}

				gl.cullFace(shape.frontFaceCull ? gl.FRONT : gl.BACK);

				shape.draw(elapsed);

				gl.bindVertexArray(null);
				this.drawCalls++;
			}
		}
	}

//Helper Functions

	extractFrustumPlanes() {
		//view proj matrix
		const m = glMatrix.mat4.create();
		glMatrix.mat4.multiply(m, this.proj, this.view);
		const planes = [];

		// Left
		planes.push([
			m[3] + m[0],
			m[7] + m[4],
			m[11] + m[8],
			m[15] + m[12]
		]);

		// Right
		planes.push([
			m[3] - m[0],
			m[7] - m[4],
			m[11] - m[8],
			m[15] - m[12]
		]);

		// Bottom
		planes.push([
			m[3] + m[1],
			m[7] + m[5],
			m[11] + m[9],
			m[15] + m[13]
		]);

		// Top
		planes.push([
			m[3] - m[1],
			m[7] - m[5],
			m[11] - m[9],
			m[15] - m[13]
		]);

		// Near
		planes.push([
			m[3] + m[2],
			m[7] + m[6],
			m[11] + m[10],
			m[15] + m[14]
		]);

		// Far
		planes.push([
			m[3] - m[2],
			m[7] - m[6],
			m[11] - m[10],
			m[15] - m[14]
		]);

		// Normalize planes
		for (let p of planes) {
			const len = Math.hypot(p[0], p[1], p[2]);
			p[0] /= len;
			p[1] /= len;
			p[2] /= len;
			p[3] /= len;
		}

		this.planes = planes;
	}

	sphereInFrustum(center, radius) {

		for (let p of this.planes) {
			const distance =
				p[0] * center[0] +
				p[1] * center[1] +
				p[2] * center[2] +
				p[3];

			if (distance < -radius) {
				return false;
			}
		}
		return true;
	}

	makeRay(ndcX, ndcY){
		const invVP = mat4.create();
		mat4.multiply(invVP, this.proj, this.view);
		mat4.invert(invVP, invVP);

		const rayClip = vec4.fromValues(ndcX, ndcY, -1.0, 1.0);
		const rayWorld = vec4.create();
		vec4.transformMat4(rayWorld, rayClip, invVP);
		vec3.scale(rayWorld, rayWorld, 1 / rayWorld[3]);

		const origin = vec3.fromValues(this.currentScene.camPos[0], this.currentScene.camPos[1], this.currentScene.camPos[2]);
		const dir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), rayWorld, origin));
		return { origin, dir };
	}

}

function checkGL(gl, where) {
    const err = gl.getError();
    if (err !== gl.NO_ERROR) {
        console.error("GL ERROR at", where, err);
    }
}
