const typeSelect = document.getElementById("selectCreateType");

const spawnRadiusInput = document.getElementById("spawnPlanetRadius");
const spawnPositionArea = document.getElementById("spawnPlanetPos");

const randomPaintSelection = document.getElementById("randomisePaint");
const randomPaintType = document.getElementById("randomType");

const randomSpawnSelection = document.getElementById("randomiseSpawn");
const randomSpawnAmount = document.getElementById("randomSpawnAmount");

typeSelect.addEventListener("change", () => renderOptions(typeSelect.value));

let pointLightCount = 1; // ensure we dont go over the cap of 32 point lights in the scene at a time

function renderOptions(type){
	

	switch(type){
		case "planet": 
			showPlanetOptions();
			break;
		case "star": 
			showStarOptions();
			break;
		case "moon": 
			showMoonPlanetOptions();
			break
		default: 
			return;
	}

}



