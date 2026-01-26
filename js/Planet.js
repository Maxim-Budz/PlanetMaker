
import CelestialBody from './CelestialBody.js';

export default class Planet extends CelestialBody {
	constructor(parentID){
		super()

		this.terrainValues = {}

		//default terrain data used when generating its texture	
		this.terrainValues.frequency = 0.5;
		this.terrainValues.amplitude = 1.0;
		this.terrainValues.octaves = 3;
		this.terrainValues.lacunarity = 1.8;
		this.terrainValues.persistence = 0.5;
		this.terrainValues.seaLevel = 0.5;

		this.terrainValues.colors = [0.145, 0.321, 0.678, 0.745, 0.678, 0.420, 0.173, 0.321, 0.157];
		this.terrainValues.thresholds = [0.4, 0.7, 1.0];

		this.terrainValues.capCol = [0.698, 0.698, 0.698];
		this.terrainValues.capSize = 0.2;
		

		this.atmosLayer = null;

		this.atmosphereValues = {};

		this.weatherLayer = null;

		this.weatherValues = {};

		this.type = "Planet";

	
		
	}	

	submit(renderer){
		if(this.baseModel)    this.baseModel.submit(renderer);
		if(this.atmosLayer)   this.atmosLayer.submit(renderer);
		if(this.weatherLayer) this.weatherLayer.submit(renderer);
		
	}

}

