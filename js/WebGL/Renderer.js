import Sphere from '../Shape/Sphere.js';

const { mat3, mat4, vec3, vec4 } = glMatrix;
//TODO change skybox rendering to cubemap...
export default class Renderer {
    constructor(gl) {
		
		this.visibleObjects = 0;
        this.gl = gl;
		this.shaderManager = null;

        this.shapes = [];
		this.skybox = null;

        this.model = glMatrix.mat4.create();
        this.view = glMatrix.mat4.create();
        this.proj = glMatrix.mat4.create();


		this.camSpeed = 0.1;
		this.camHeight = 800.0;
		this.camPos = [10, -16, 10];

		this.focusPoint = [0,0,0];

		this.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, this.aspect, 0.1, 10000.0);
        glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0]);
		
		this.ambient = [0.1,0.1,0.1];
		
		this.pointLights = [];

		this.lightPositions = [];
		this.lightColors     = [];
		this.lightIntensities = [];
		this.lightDistances = [];

		for (let L of this.pointLights) {
			this.lightPositions.push(...L.position);
			this.lightColors.push(...L.color);
			this.lightIntensities.push(L.intensity);
			this.lightDistances.push(L.distance);
		}

		this.normalMatrix = mat3.create();
		mat3.fromMat4(this.normalMatrix, this.model);
		mat3.invert(this.normalMatrix, this.normalMatrix);
		mat3.transpose(this.normalMatrix, this.normalMatrix);


		this.numLights = this.pointLights.length;
    }


	//loads the global values that is the same for all objects.
	setFrameUniforms(shaderName) {


		this.shaderManager.apply(shaderName, "uProj",  this.proj);
		this.shaderManager.apply(shaderName, "uView",  this.view);
		this.shaderManager.apply(shaderName, "uCamPos", this.camPos);
		this.shaderManager.apply(shaderName, "uTime", performance.now() * 0.001);
		this.shaderManager.apply(shaderName, "uNormal", this.normalMatrix);
		this.shaderManager.apply(shaderName, "uAmbient", this.ambient);

		this.shaderManager.apply(shaderName, "uNumLights", this.pointLights.length);
		this.shaderManager.apply(shaderName, "uPointLightPositions",new Float32Array(this.lightPositions)); 
		this.shaderManager.apply(shaderName, "uPointLightColors",new Float32Array(this.lightColors)); 
		this.shaderManager.apply(shaderName, "uPointLightIntensities",new Float32Array(this.lightIntensities)); 
		this.shaderManager.apply(shaderName, "uPointLightDistances",new Float32Array(this.lightDistances));

	}




    addShape(shape) {
        this.shapes.push(shape);
    }



	removeShape(shapeIndex){
		this.shapes.splice(shapeIndex, 1);
	}



	addPointLight(pos, color, intensity, maxDist ){
		this.pointLights.push({ position:pos, color:color, intensity:intensity, distance:maxDist});
		this.lightPositions.push(...pos);
		this.lightColors.push(...color);
		this.lightIntensities.push(intensity);
		this.lightDistances.push(maxDist);

	}


	render(elapsed, selectedID){
		this.visibleObjects = 0;
		const gl = this.gl;


        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		let t = performance.now() * 0.001;
		let theta = t * this.camSpeed;
		let phi = 0.6;
		const radius = Math.max(this.camHeight, 1.0);
		let camX = radius * Math.cos(phi) * Math.cos(theta);
		let camZ = radius * Math.cos(phi) * Math.sin(theta);
		let camY = radius * Math.sin(phi);
		this.camPos = [this.focusPoint[0] + camX, this.focusPoint[1] + camY, this.focusPoint[2] + camZ];

		glMatrix.mat4.lookAt(this.view, this.camPos, this.focusPoint, [0, 1, 0] );
		this.extractFrustumPlanes();

		//skybox first
		gl.useProgram(this.shaderManager.programs["skyboxShader"].program);
		gl.depthMask(false);
		this.setFrameUniforms("skyboxShader");
		this.shaderManager.applyShapeUniforms(this.skybox);

		gl.bindVertexArray(this.skybox.vao);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.skybox.texture);
		this.shaderManager.apply("skyboxShader", "uTexture", 0);
		gl.cullFace(gl.FRONT);
		
		this.skybox.draw(elapsed);
		gl.bindVertexArray(null);
		gl.cullFace(gl.BACK);
		gl.depthMask(true);


		//for each shader, render the objects that use it
		for (const shaderName in this.shaderManager.programs){
			gl.useProgram(this.shaderManager.programs[shaderName].program);			
			this.setFrameUniforms(shaderName);

			//TODO put shapes in scene class that will be made soon
			for (const shape of this.shapes.filter(s => s.shader.name === shaderName)){

				//Optimisation here, Cull everything outside of view frustrum. Add switch if I use something other than sphere...
				if (shape instanceof Sphere && this.sphereInFrustum(shape.position, shape.radius) ){
					//apply select filter. TODO, change the selected object to use frensel shader...
					this.shaderManager.apply(shape.shader.name, "uTransparency", shape.id === selectedID ? 0.4 : 1.0);

					this.shaderManager.applyShapeUniforms(shape);

					gl.bindVertexArray(shape.vao);
					if (shape.texture) {
						if (!(shape.texture instanceof WebGLTexture)) {
						console.error("Error: shape.texture is not a WebGLTexture object!", shape.texture);
						} else {
							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D, shape.texture);
						
							//const err = gl.getError();
							//if (err) console.error("GL ERROR at bind texture:", err, "Shape ID:", shape.id);
							
							this.shaderManager.apply(shaderName, "uTexture", 0);
						}
					}

					if(shape.frontFaceCull){
						gl.cullFace(gl.FRONT);
					}else{
						gl.cullFace(gl.BACK);
					}


					shape.draw(elapsed);

					gl.bindVertexArray(null);
					this.visibleObjects++;


				}else{
					continue;

				}	

			}
		}

		console.log(this.visibleObjects);
	}

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

	sphereInFrustumDEBUG(center, radius) {
		console.log(center, radius);
		return false;  // Should cull everything
	}






	makeRay(ndcX, ndcY){
		const invVP = mat4.create();
		mat4.multiply(invVP, this.proj, this.view);
		mat4.invert(invVP, invVP);

		const rayClip = vec4.fromValues(ndcX, ndcY, -1.0, 1.0);
		const rayWorld = vec4.create();
		vec4.transformMat4(rayWorld, rayClip, invVP);
		vec3.scale(rayWorld, rayWorld, 1 / rayWorld[3]);

		const origin = vec3.fromValues(this.camPos[0], this.camPos[1], this.camPos[2]);
		const dir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), rayWorld, origin));
		return { origin, dir };
	}


	setAmbientColor([r,g,b]){
		this.ambient = [r, g, b];
	}

}

function checkGL(gl, where) {
    const err = gl.getError();
    if (err !== gl.NO_ERROR) {
        console.error("GL ERROR at", where, err);
    }
}
