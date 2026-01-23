precision mediump float;

uniform sampler2D uTexture;
uniform vec3 uCamPos;
varying vec2 vUV;

//very basic shader for a skybox with just a texture
void main(void) {
	vec2 uv = vUV * vec2(6.0, 4.0);
	vec3 tex = texture2D(uTexture, uv).rgb - vec3(0.5,0.5,0.5);
	gl_FragColor = vec4(tex, 1.0); 

}




