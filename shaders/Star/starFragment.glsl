precision mediump float;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uGlowColor;
uniform float uGlowStrength;

varying vec3 vColor; 
varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
	//animated texture
	vec2 uv = vUV;
	uv.x += sin(uTime * 0.2 + uv.y * 8.0) * 0.02;
	uv.y += cos(uTime * 0.25 + uv.x * 5.0) * 0.02;
	vec3 tex = texture2D(uTexture, uv).rgb;
	vec3 color = tex * vColor * 2.0;


	//fresnel

	vec3 N = normalize(vNormal);
	vec3 V = vec3(0.0, 0.0, 1.0);

	float fresnel = pow(1.0 - dot(N, V), 4.0);

	color += fresnel * uGlowColor * uGlowStrength;

	gl_FragColor = vec4(color, 1.0);


}

