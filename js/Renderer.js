const { mat4, vec3 } = glMatrix;

export default class Renderer {
    constructor(canvas) {

        this.gl = canvas.getContext("webgl2");
        if (!this.gl) throw "WebGL2 not supported";

        this.shapes = [];
        this.model = glMatrix.mat4.create();
        this.view = glMatrix.mat4.create();
        this.proj = glMatrix.mat4.create();

		this.camSpeed = 1.0;
		this.camHeight = 10.0;


    }

	async init(vertexUrl, fragmentUrl) {
        const gl = this.gl;
		this.program = await this.loadShaders(vertexUrl, fragmentUrl);
        gl.useProgram(this.program);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);

        this.uProj		= gl.getUniformLocation(this.program, "uProj");
        this.uView		= gl.getUniformLocation(this.program, "uView");
        this.uModel		= gl.getUniformLocation(this.program, "uModel");
        this.uProj      = gl.getUniformLocation(this.program, "uProj");
        this.uView      = gl.getUniformLocation(this.program, "uView");
        this.uModel     = gl.getUniformLocation(this.program, "uModel");
		this.uNormal	= gl.getUniformLocation(this.program, "uNormal");
        this.uLightDir  = gl.getUniformLocation(this.program, "uLightDir");
        this.uLightColor= gl.getUniformLocation(this.program, "uLightColor");
        this.uAmbient   = gl.getUniformLocation(this.program, "uAmbient");
        this.uCamPos    = gl.getUniformLocation(this.program, "uCamPos");
        this.uShininess = gl.getUniformLocation(this.program, "uShininess");
        this.uSpecColor = gl.getUniformLocation(this.program, "uSpecColor");


        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, aspect, 0.1, 1000.0);
        glMatrix.mat4.lookAt(this.view, [10, -16, 10], [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(this.uProj, false, this.proj);
        gl.uniformMatrix4fv(this.uView, false, this.view);
        gl.uniform3fv(this.uCamPos, [3, -15, 5]);
        gl.uniform3fv(this.uLightDir, [0, 12.0, 10.0]);
        gl.uniform3fv(this.uLightColor, [1, 1, 1]);
        gl.uniform3fv(this.uAmbient, [0.3, 0.3, 0.3]);
        gl.uniform1f(this.uShininess, 31.0);
        gl.uniform3fv(this.uSpecColor, [1, 1, 1]);


	}

    async loadShaders(vertexUrl, fragmentUrl) {
        const gl = this.gl;

        const vShader = await this.loadShader(vertexUrl, gl.VERTEX_SHADER);
        const fShader = await this.loadShader(fragmentUrl, gl.FRAGMENT_SHADER);
        const program = this.gl.createProgram();

        this.gl.attachShader(program, vShader);
        this.gl.attachShader(program, fShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
			return null;
        }
        return program;


    }

    async loadShader(url, type) {
        const res = await fetch(url);
		const src = await res.text();
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }


	// shape = { vertices, normals, colors, buffers }

    addShape(shape) {
        this.shapes.push(shape);
    }

	removeShape(shapeID){
		this.shapes.splice(shapeID, 1);
	}

    render(elapsed) {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//CAMERA ORBIT
		let t = performance.now() * 0.001; // seconds
		let theta = t * this.camSpeed;
		let phi = 0.6;

		const radius = Math.max(this.camHeight, 1.0);

		let camX = radius * Math.cos(phi) * Math.cos(theta);
		let camZ = radius * Math.cos(phi) * Math.sin(theta);
		let camY = radius * Math.sin(phi);

		glMatrix.mat4.lookAt(this.view, [camX, camY, camZ], [0, 0, 0], [0, 1, 0] );

        for (let shape of this.shapes) {
            shape.draw(this.view, this.proj, elapsed);
        }
    }

	setLightDirection([x,y,z]){
		const gl = this.gl;
		gl.uniform3fv(this.uLightDir, [x, y, z]);
	}

	setAmbientColor([r,g,b]){
		const gl = this.gl;
		console.log([r,g,b]);
		gl.uniform3fv(this.uAmbient, [r, g, b]);
	}

}

