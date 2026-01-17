precision mediump float;
varying vec3 vColor;
varying float vDepth;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;

uniform vec3 uCamPos;
uniform float uShininess;
uniform vec3 uSpecColor;


void main(void) {

	vec3 n = normalize(vNormal);
	vec3 l = normalize(uLightDir);
	vec3 v = normalize(uCamPos - vPosition);
	vec3 h = normalize(l + v);
	
	//diffuse
	float ndotl = max(dot(n, l), 0.0);
	vec3 diffuse = uLightColor * ndotl;

	//specular
	float spec = pow(max(dot(n, h), 0.0), uShininess);
	vec3 specular = spec * uSpecColor;

	vec3 color = specular + diffuse + uAmbient;

	float fade = clamp(1.0 / (vDepth * 0.6), 0.0, 1.0);

	gl_FragColor = vec4(vColor * color, 1.0);
	//gl_FragColor = vec4(abs(vNormal), 1.0);

	
}
