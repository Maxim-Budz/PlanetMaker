attribute vec3 aColor;
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUV;

void main() {

  vNormal = mat3(uModel) * aNormal;
  vUV = aUV;

  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
  vColor = aColor;
}
