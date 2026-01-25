const { mat3, mat4, vec3, vec4 } = glMatrix;
//handle some stuff from renderer that does not make sense to be there.
//WIP
export default class Scene{
    constructor(gl) {

		this.models = [];
		this.shadersUsed = [];

		this.skybox = null;

		
		this.camSpeed = 0.1;
		this.camHeight = 800.0;
		this.camPos = [10, -16, 10];

		this.focusPoint = [0,0,0];

		this.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, this.aspect, 0.1, 10000.0);
        glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0]);
		
		this.ambient = [0.1,0.1,0.1];
		
		this.pointLights = [];

		this.lightPositions = [];
		this.lightColors     = [];
		this.lightIntensities = [];
		this.lightDistances = [];

		this.normalMatrix = mat3.create();
		mat3.fromMat4(this.normalMatrix, this.model);
		mat3.invert(this.normalMatrix, this.normalMatrix);
		mat3.transpose(this.normalMatrix, this.normalMatrix);


		this.numLights = this.pointLights.length;


	}
}
