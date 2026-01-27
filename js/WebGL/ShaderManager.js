import ShaderProgram from './ShaderProgram.js'

export default class ShaderManager{
	constructor(gl){		
        this.gl = gl;
		this.programs = {};
	}

	use(name) {
		this.programs[name].use();
		return this.programs[name];  	
	}

	applyShapeUniforms(shape){
		for(let uniform in shape.uniforms){
			this.apply(shape.shader.name, uniform, shape.uniforms[uniform]);
		}

	}
	apply(programName, name, value) {
		this.programs[programName].apply(name, value);
	}



	//Loading & Compiling shader functions
	async load(name, vertUrl, fragUrl) {
		const gl = this.gl;
		const {program, uniforms, attributes} = await this.compileAndReflect(vertUrl, fragUrl);
		this.programs[name] = new ShaderProgram(gl,name, program, uniforms, attributes);
	}

	async compileAndReflect(vertexUrl, fragmentUrl){
		const gl = this.gl;

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
			    let name = info.name;

				const uniformMetadata = {
						location: gl.getUniformLocation(program, name),
						type: info.type,
						size: info.size
					};

				if (name.endsWith("[0]")) {
					name = name.slice(0, -3);
				}

			uniforms[name] = uniformMetadata;
		}

		return {program, uniforms, attributes}

	}

	async loadShaders(vertexUrl, fragmentUrl) {
		const gl = this.gl;
        const vShader = await this.loadShader(vertexUrl, gl.VERTEX_SHADER);
        const fShader = await this.loadShader(fragmentUrl, gl.FRAGMENT_SHADER);
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

    async loadShader(url, type) {
		const gl = this.gl;
        const res = await fetch(url,  { cache: "no-store" });
		
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
