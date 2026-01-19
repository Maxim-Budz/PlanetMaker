export default class ShaderManager(){
	constructor(gl){		
        this.gl = gl;
		this.programs = {};
	}

	use(name) {
		this.programs[name].use();
		return this.programs[name];  	
	}

//Loading & Compiling shader functions
	async load(name, vertUrl, fragUrl) {
		const {program, uniforms, attributes} = await compileAndReflect(gl, vertUrl, fragUrl);
		this.programs[name] = new ShaderProgram(gl, program, uniforms, attributes);
	}

	async compileAndReflect(gl, vertexUrl, fragmentUrl){

		const program = await this.loadShaders(vertexUrl, fragmentUrl);

		const attributes = {};
		const uniforms = {};

		const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);


		for (let i = 0; i < attribCount; i++) {
			const info = gl.getActiveAttrib(program, i);
			attributes[info.name] = gl.getAttribLocation(program, info.name);
		}

		for (let i = 0; i < uniformCount; i++) {
			const info = gl.getActiveUniform(program, i);
			uniforms[info.name] = gl.getAttribLocation(program, info.name);
		}

		return {program, uniforms, attributes}

	}

	async loadShaders(gl, vertexUrl, fragmentUrl) {
        const vShader = await this.loadShader(gl, vertexUrl, gl.VERTEX_SHADER);
        const fShader = await this.loadShader(gl, fragmentUrl, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
			return null;
        }
        return program;
    }

    async loadShader(gl, url, type) {
        const res = await fetch(url);
		const src = await res.text();
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

















}
