
const sphereSelect = document.getElementById("sphereID");
const spawnRadiusInput = document.getElementById("spawnRadius");
const spawnPositionArea = document.getElementById("spawnPos");
const randomSelection = document.getElementById("randomisePlanet");


const spawnPlanetBtn = document.getElementById("newPlanet");
const killPlanetBtn = document.getElementById("killPlanet");

console.log(spawnPlanetBtn);



spawnPlanetBtn.addEventListener("click", collectAndSpawn);
killPlanetBtn.addEventListener("click", kill);



function collectAndSpawn(){
	const spawnRadius = parseFloat(spawnRadiusInput.value);
	const posInputs = spawnPositionArea.querySelectorAll("input");
	const position = Array.from(posInputs)
		.filter(input => input.type === "number")
		.map(input => input.value);

	const random = randomSelection.value;
	console.log(position);
	App.createPlanet(spawnRadius, 64, 64, position);
}




function kill(){
	const sphereID = sphereSelect.value;
	App.killPlanet(sphereID);	
}


