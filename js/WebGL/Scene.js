const { mat3, mat4, vec3, vec4 } = glMatrix;
//handle some stuff from renderer that does not make sense to be there.
export default class Scene{
    constructor(gl) {

		this.models = [];
		this.shadersUsed = [];

		this.skybox = null;

		this.camSpeed = 0.1;
		this.camHeight = 800.0;
		this.camPos = [10, -16, 10];

		this.focusPoint = [0,0,0];

		this.ambient = [0.1,0.1,0.1];
		
		this.pointLights = [];

		this.lightPositions = [];
		this.lightColors     = [];
		this.lightIntensities = [];
		this.lightDistances = [];




		this.numLights = this.pointLights.length;


	}

	submit(renderer) {
		this.skybox.submit(renderer);
		//order models by distance to camera.
		for (const model of this.models) {
			model.submit(renderer);
		}
	}

	addBody(body) {
        this.models.push(body);
    }

	removeBody(id){
		this.models = this.models.filter(m => m.id != id);
	}

	addPointLight(pos, color, intensity, maxDist){
		this.pointLights.push({ position:pos, color:color, intensity:intensity, distance:maxDist});
		this.lightPositions.push(...pos);
		this.lightColors.push(...color);
		this.lightIntensities.push(intensity);
		this.lightDistances.push(maxDist);

	}
}


