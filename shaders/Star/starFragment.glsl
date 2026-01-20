precision mediump float;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uGlowColor;
uniform float uGlowStrength;
uniform vec3 uCamPos;
uniform float uTransparency;

varying vec3 vPosition;
varying vec3 vColor; 
varying vec3 vNormal;
varying vec2 vUV;

//TODO add a uniform array for colours to blend the sun with, max 4.
vec3 starColor(float t) {
    vec3 red    = vec3(1.0, 0.2, 0.05);
    vec3 orange = vec3(1.0, 0.5, 0.1);
    vec3 yellow = vec3(1.0, 0.9, 0.4);
    vec3 white  = vec3(1.0);

	vec3 blue = vec3(0.05, 0.1, 1.0);
	vec3 lightBlue = vec3(0.1, 0.1, 1.0);

    t = clamp(t, 0.0, 1.0);

    if (t < 0.3) return mix(red, orange, t / 0.33);
    if (t < 0.6) return mix(orange, yellow, (t - 0.33) / 0.33);
    return mix(yellow, white, (t - 0.66) / 0.34);
}

void main(void) {
	//animated texture
	vec2 uv = vUV;
	uv.x += sin(uTime * 0.15 + uv.y * 10.0) * 0.03;
	uv.y += cos(uTime * 0.12 + uv.x * 8.0) * 0.03;
	uv = fract(uv);
	vec3 tex = texture2D(uTexture, uv).rgb;

	float mask = tex.r;
	mask = pow(mask, 1.0);

	//vec3 baseColor = vec3(0.9, 0.9, 0.9);
	//vec3 highlight = vColor;

	//vec3 color = mix(baseColor, highlight, mask);

	vec3 color = starColor(mask);
	//vec3 color = mix(vColor, uGlowColor/3.0, mask);
	//vec3 color = vColor * mask;


	//fresnel

	vec3 N = normalize(vNormal);
    vec3 V = normalize(vPosition- uCamPos);

	float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uGlowStrength);
	color = mix(color, uGlowColor, fresnel);
	color *= 1.0 + 0.1 * sin(uTime + mask * 10.0);
	gl_FragColor = vec4(color, uTransparency); 

}



