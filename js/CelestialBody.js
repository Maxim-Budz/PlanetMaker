export default class CelestialBody{
	constructor(){	
		this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
	
		this.selectPosition = null;
		this.selectRadius = null;

		this.baseModel = null;
		this.atmosLayer = null;

		this.type = null;
	}
}
