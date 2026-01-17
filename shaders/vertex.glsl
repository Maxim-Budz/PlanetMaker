precision mediump float;
attribute vec3 aColor;
attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 vColor;
varying float vDepth;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

uniform mat3 uNormal;

varying vec3 vPosition;
varying vec3 vNormal;
uniform vec3 uCamPos;

void main(void) {
	gl_PointSize = 5.0;
	vec4 worldPos = uModel * vec4(aPosition, 1.0);
	vPosition = worldPos.xyz;
	vNormal = normalize(uNormal * aNormal);

	gl_Position = uProj * uView * worldPos;

	vDepth = distance(worldPos.xyz, uCamPos);
	vColor = aColor;
}
