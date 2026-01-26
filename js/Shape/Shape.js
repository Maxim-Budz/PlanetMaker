const { mat4, mat3, vec3 } = glMatrix;
import Renderer from '../WebGL/Renderer.js';
import RenderPass from '../Constants/RenderPass.js';
import ShaderManager from '../WebGL/ShaderManager.js';

export default class Shape {
    constructor(gl, renderer, shaderName, shaderManager, renderPass) {

		this.gl = gl;
		this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);

        this.shader = shaderManager.programs[shaderName];
		this.renderPass = renderPass; 

		this.renderer = renderer;
		this.shaderManager = shaderManager;

		this.boundingRadius = 10.0;

        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];

		this.rotationSpeed = [0,0,0];
		this.animated = false;

        this.model = mat4.create();

		this.vertices	= [];
		this.colors		= [];
		this.normals	= [];
		this.uvs		= [];
		this.indices	= [];

		this.frontFaceCull = false;

		this.uniforms = {};
		this.vao = gl.createVertexArray();

		this.texture = null;


		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);


        this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);


		this.colorBuffer =  gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);			

		this.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

		this.uvBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);


        this.vertexCount = 0;

		this.rebindBuffers();

    }

	refillBuffers(){
		const gl = this.gl;
		gl.useProgram(this.shader.program);
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);


		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);


		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);			

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);


		gl.bindVertexArray(null);
	}

	rebindBuffers(){
		const gl = this.gl;
		gl.useProgram(this.shader.program);
		gl.bindVertexArray(this.vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		const posLoc = gl.getAttribLocation(this.shader.program, "aPosition");
		console.log("aPosition location:", posLoc);
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		const normLoc = gl.getAttribLocation(this.shader.program, "aNormal");
		gl.enableVertexAttribArray(normLoc);
		gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		const colLoc = gl.getAttribLocation(this.shader.program, "aColor");		
		if (colLoc !== -1 && this.colors.length > 0) {
			gl.enableVertexAttribArray(colLoc);
			gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, 0, 0);
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		if (this.indices && this.indices.length > 0) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		const uvLoc = gl.getAttribLocation(this.shader.program, "aUV");
		if (uvLoc !== -1 ) {
			gl.enableVertexAttribArray(uvLoc);
			gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
		}

		gl.bindVertexArray(null);



	}

    update() {
        mat4.identity(this.model);
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateX(this.model, this.model, this.rotation[0]);
        mat4.rotateY(this.model, this.model, this.rotation[1]);
        mat4.rotateZ(this.model, this.model, this.rotation[2]);
        mat4.scale(this.model, this.model, this.scale);
    }

	verifyData() {
		const vCount = this.vertices.length / 3;
		const uvCount = this.uvs.length / 2;
		const nCount = this.normals.length / 3;

		console.log(`--- Shape Data Check ---`);
		console.log(`Vertices: ${vCount}`);
		console.log(`UVs: ${uvCount}`);
		console.log(`Normals: ${nCount}`);

		if (vCount !== uvCount) {
			console.error("MISMATCH: You have " + vCount + " vertices but " + uvCount + " UVs!");
		}
	}

	//submit thyself to render where it will be placed in correct queue.
	submit(renderer){    
		if (!renderer.sphereInFrustum(this.position, this.boundingRadius)) 
			return;
		renderer.submit(this.renderPass, this.shader.name, this);
	}





	draw(elapsed) {
		const gl = this.gl;
		if (!this.shader || !this.shader.program) return;
		//this.verifyData();

		mat4.identity(this.model);
		mat4.translate(this.model, this.model, this.position);

		const indexCount = this.indices.length;

		this.shaderManager.apply(this.shader.name, "uModel", this.model);

		if (indexCount > 0) {
			gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
			//gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
		} else {
			console.warn("No indices found, attempting drawArrays");
			gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
		}
	}
}



