precision mediump float;


uniform float uRadius;
uniform vec3 uGlowColor;
uniform float uGlowStrength;
uniform vec3 uPlanetCenter;

uniform vec3 uCamPos;
uniform float uTransparency;

varying vec3 vPosition;
varying vec3 vNormal;


void main(void) {
	
	// inverted fresnel edges for glow
	
	vec3 N = normalize(vNormal);
	vec3 innerN = normalize(vPosition - uPlanetCenter);

    vec3 V = normalize(uCamPos - vPosition);

	float ndotv = dot(N,V);
	float glowMask = smoothstep(0.0, 0.3, 1.0 - ndotv);


	float fresnel = 1.0 - pow(1.0 - clamp(ndotv, 0.0, 1.0), 0.8 );
	float rim = fresnel * smoothstep(0.0, 0.5, fresnel);

	vec3 color = uGlowColor * rim * glowMask;

	gl_FragColor = vec4(color, 0.8); 
}



