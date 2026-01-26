import CelestialBody from './CelestialBody.js';

export default class Moon extends CelestialBody {
	constructor(parentID){
		super()
		this.parent = parentID;
		this.color = null;
		this.type = "Moon";
		
	}

}

