precision mediump float;

#define MAX_LIGHTS 32

//points lights
uniform int uNumLights;
uniform vec3 uPointLightPositions[MAX_LIGHTS];
uniform vec3 uPointLightColors[MAX_LIGHTS];
uniform float uPointLightIntensities[MAX_LIGHTS];
uniform float uPointLightDistances[MAX_LIGHTS];

uniform vec3 uAmbient;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor; 
uniform float uTransparency;

uniform vec3 uCamPos;


void main(void) {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(uCamPos - vPosition);
    
	vec3 diffuse = vec3(0.0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
		if(i >= uNumLights) break;
		if( length(uPointLightPositions[i] - vPosition) > uPointLightDistances[i]) continue;
        vec3 L = normalize(uPointLightPositions[i] - vPosition);
        float ndotl = max(dot(n, L), 0.0);
        diffuse += ndotl * uPointLightColors[i] * uPointLightIntensities[i];
    }

    vec3 combinedLighting = diffuse + uAmbient;
	gl_FragColor = vec4(vColor * combinedLighting, uTransparency);

}
