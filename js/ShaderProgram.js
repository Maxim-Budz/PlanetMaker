export class ShaderProgram {
  constructor(gl, program, uniforms, attributes) {
    this.gl = gl;
    this.program = program;
    this.uniforms = uniforms;
    this.attributes = attributes;
  }

  use() {
    this.gl.useProgram(this.program);
  }
}

