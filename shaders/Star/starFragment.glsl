precision mediump float;

#define MAX_MAIN_COLORS 4

uniform sampler2D uTexture;
uniform float uRadius;
uniform float uTime;
uniform vec3 uGlowColor;
uniform float uGlowStrength;
uniform vec3 uCamPos;
uniform float uTransparency;
uniform vec3 uMainColors[MAX_MAIN_COLORS];

varying vec3 vPosition;
varying vec3 vColor; 
varying vec3 vNormal;
varying vec2 vUV;

//TODO add a uniform array for colours to blend the sun with, max 4.
vec3 starColor(float t) {
    t = clamp(t, 0.0, 1.0);

    if (t < 0.3) return mix(uMainColors[0], uMainColors[1], t / 0.33);
    if (t < 0.6) return mix(uMainColors[1], uMainColors[2], (t - 0.33) / 0.33);
    return mix(uMainColors[2], uMainColors[3], (t - 0.66) / 0.34);
}

void main(void) {
	//animated texture
	vec2 uv = vUV;
	uv.x += sin(uTime * 0.15 + uv.y * 10.0) * 0.03;
	uv.y += cos(uTime * 0.12 + uv.x * 8.0) * 0.03;
	uv = fract(uv);
	vec3 tex = texture2D(uTexture, uv).rgb;

	float mask = tex.r;
	//mask = pow(mask, 1.0);

	vec3 color = starColor(mask);


	//fresnel


	vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vPosition);

	float dynamicPower = 3.0 / (uRadius * 0.02);

	dynamicPower = max(dynamicPower, 1.1);

	float fresnel = pow(1.0 - max(dot(N, V), 0.0), dynamicPower );

	float finalGlow = fresnel * uGlowStrength * (1.0 + uRadius * 0.01);
    
	
	color = mix(color, uGlowColor, finalGlow);
	color *= 1.0 + 0.075 * sin(uTime + mask * 10.0);
	gl_FragColor = vec4(color, uTransparency); 

}



