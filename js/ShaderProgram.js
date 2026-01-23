
export default class ShaderProgram {
	constructor(gl,name, program, uniforms, attributes) {
		this.gl = gl;
		this.name = name;
		this.program = program;
		this.uniforms = uniforms;
		this.attributes = attributes;

		this.flag = true;

	}	

	use() {
		this.gl.useProgram(this.program);
	}

	apply(name, value) {
		const gl = this.gl;
		const u = this.uniforms[name]; // Metadata object created above
		if (!u || !u.location) return;

		switch (u.type) {
			case gl.FLOAT: 
				u.size > 1 ? gl.uniform1fv(u.location, value) : gl.uniform1f(u.location, value);
				break;
			case gl.FLOAT_VEC2: gl.uniform2fv(u.location, value); break;
			case gl.FLOAT_VEC3: gl.uniform3fv(u.location, value); break;
			case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.location, false, value); break;
			case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.location, false, value); break; 
			case gl.INT: gl.uniform1i(u.location, value); break;
			case gl.SAMPLER_2D: gl.uniform1i(u.location, value); break;
		}
	}
}

