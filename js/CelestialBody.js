export default class CelestialBody{
	constructor(){	
		this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
	
		this.selectPosition = null;
		this.selectRadius = null;

		this.baseModel = null;

		this.type = "None";
	}


	submit(renderer){
		if(this.baseModel)    this.baseModel.submit(renderer);
	}

	destroy(){
		this.baseModel.destroy();
	}

}
