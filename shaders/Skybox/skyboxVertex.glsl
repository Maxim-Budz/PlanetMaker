attribute vec3 aPosition;
attribute vec2 aUV;

uniform mat4 uView;
uniform mat4 uProj;

varying vec2 vUV;

void main() {

	vUV = aUV;	

	mat4 viewRot = mat4(mat3(uView));
	vec4 pos = viewRot * vec4(aPosition, 1.0);


	gl_Position = uProj * pos;
}

