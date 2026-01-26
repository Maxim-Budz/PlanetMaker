
import CelestialBody from './CelestialBody.js';

export default class Star extends CelestialBody {
	constructor(parentID){
		super()

		this.starOptions = {}

	
		this.starOptions.glowColor = [0.9,0.0,0.0];
 
		this.starOptions.glowStrength = 0.6; 

		this.starOptions.mainColors = [0.8,0.2,0.1, 1.0,0.6,0.2, 1.0,0.85,0.6, 1.0,1.0,0.9];

		this.glowLayer = null;

	
	}

	submit(renderer){
		if(this.baseModel)    this.baseModel.submit(renderer);
		if(this.glowLayer)   this.glowLayer.submit(renderer);

	}


}


