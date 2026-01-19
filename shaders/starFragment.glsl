precision mediump float;

uniform vec3 uAmbient;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor; 
uniform float uTransparency;

uniform vec3 uCamPos;


void main(void) {

    vec3 combinedLighting = diffuse + uAmbient;
	gl_FragColor = vec4(vColor * combinedLighting, uTransparency);


}
