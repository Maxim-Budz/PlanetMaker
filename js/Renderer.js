const { mat3, mat4, vec3, vec4 } = glMatrix;

export default class Renderer {
    constructor(gl) {

        this.gl = gl;
		this.shaderManager = null;

        this.shapes = [];
        this.model = glMatrix.mat4.create();
        this.view = glMatrix.mat4.create();
        this.proj = glMatrix.mat4.create();



		this.camSpeed = 1.0;
		this.camHeight = 10.0;
		this.camPos = [10, -16, 10];

		this.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, this.aspect, 0.1, 1000.0);
        glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0]);

		
		this.pointLights = [
			{ position:[7,7,7], color:[1.0,0.0,0.0], intensity:1.0, distance:100.0},
			{ position:[-4,2,-4], color:[0.0,1.0,0.0], intensity:0.7, distance:7.0},
			{ position:[4,6,-4], color:[0.0,0.0,1.0], intensity:0.8, distance: 30.0},  
			{ position:[-4,0,4], color:[1.0,1.0,1.0], intensity:0.5, distance: 30.0},  
		];
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
		mat3.fromMat4(this.normalMatrix, this.model); // Start with model matrix
		mat3.invert(this.normalMatrix, this.normalMatrix);       // Invert
		mat3.transpose(this.normalMatrix, this.normalMatrix);    // Transpose


		this.numLights = this.pointLights.length;
    }


	//loads the global values that is the same for all objects.
	setFrameUniforms(shaderName) {


		this.shaderManager.apply(shaderName, "uProj",  this.proj);
		this.shaderManager.apply(shaderName, "uView",  this.view);
		this.shaderManager.apply(shaderName, "uCamPos", this.camPos);
		this.shaderManager.apply(shaderName, "uTime", performance.now() * 0.001);
		this.shaderManager.apply(shaderName, "uNormal", this.normalMatrix);
		this.shaderManager.apply(shaderName, "uAmbient", [0.3,0.3,0.3]);

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

	render(elapsed, selectedID){
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
		this.camPos = [camX, camY, camZ];
		glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0] );

		//for each shader, render the objects that use it
		for (const shaderName in this.shaderManager.programs){
			gl.useProgram(this.shaderManager.programs[shaderName].program);
			
			this.setFrameUniforms(shaderName);
			//TODO put shapes in scene class that will be made soon
			for (const shape of this.shapes.filter(s => s.shader.name === shaderName)){
				//this.shaderManager.applyShapeUniforms(shape);
				//apply select filter
				this.shaderManager.apply(shape.shader.name, "uTransparency", shape.id === selectedID ? 0.4 : 1.0);
				gl.bindVertexArray(shape.vao);

				shape.draw(elapsed);
			}
		}
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

	addPointLight(pos, color, intensity, maxDist ){
		this.pointLights.push({ position:pos, color:color, intensity:intensity, distance:maxDist});
	}

	setAmbientColor([r,g,b]){
		const gl = this.gl;
		console.log([r,g,b]);
		gl.uniform3fv(this.uAmbient, [r, g, b]);
	}

}

