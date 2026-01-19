const { mat4, mat3, vec3 } = glMatrix;
import Renderer from './Renderer.js';

export default class Shape {
    constructor(gl, program, renderer) {

		this.gl = gl;
		this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.program = program;
		this.renderer = renderer;

        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];

		this.rotationSpeed = [0,0,0];
		this.animated = false;

        this.model = mat4.create();

		this.vertices	= [];
		this.colors		= [];
		this.normals	= [];
		this.uvs		= null;
		this.indices	= null;

        this.vertexBuffer = null;
        this.normalBuffer = null;
		this.colorBuffer = null;
        this.vertexCount = 0;

    }

    update() {
        mat4.identity(this.model);
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateX(this.model, this.model, this.rotation[0]);
        mat4.rotateY(this.model, this.model, this.rotation[1]);
        mat4.rotateZ(this.model, this.model, this.rotation[2]);
        mat4.scale(this.model, this.model, this.scale);
    }

	draw(viewMatrix, projMatrix, elapsed) {
        const gl = this.gl;
        gl.useProgram(this.program);

        mat4.identity(this.model);
        mat4.translate(this.model, this.model, this.position);

		if (this.animated){
			
			this.rotation[0] += this.rotationSpeed[0] * elapsed;
			this.rotation[1] += this.rotationSpeed[1] * elapsed;
			this.rotation[2] += this.rotationSpeed[2] * elapsed;

			mat4.rotateX(this.model, this.model, this.rotation[0]);
			mat4.rotateY(this.model, this.model, this.rotation[1]);
			mat4.rotateZ(this.model, this.model, this.rotation[2]);
		}
		

        const uModel = gl.getUniformLocation(this.program, "uModel");
        const uView  = gl.getUniformLocation(this.program, "uView");
        const uProj  = gl.getUniformLocation(this.program, "uProj");
		const uNormal= gl.getUniformLocation(this.program, "uNormal");


        gl.uniformMatrix4fv(uModel, false, this.model);
        gl.uniformMatrix4fv(uView,  false, viewMatrix);
        gl.uniformMatrix4fv(uProj,  false, projMatrix);

		

		const normalMat = mat3.create();
		mat3.normalFromMat4(normalMat, this.model);
		gl.uniformMatrix3fv(this.renderer.uNormal, false, normalMat);

        gl.bindVertexArray(this.vao);

		this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(this.program, "aPosition");
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		const normLoc = gl.getAttribLocation(this.program, "aNormal");
        gl.enableVertexAttribArray(normLoc);

		this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

		
		if(this.colors.length > 0){
			const colorLoc = gl.getAttribLocation(this.program, "aColor");
			gl.enableVertexAttribArray(colorLoc);


			this.colorBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
			gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
		}

		if(this.uvs.length > 0){
			const uvLoc = gl.getAttribLocation(this.program, "")
		}
		

		if (this.indices) {
			this.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);


			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
			gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);

		} else {
			gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
		}
    }
}

