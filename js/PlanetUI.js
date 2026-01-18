
const spawnRadiusInput = document.getElementById("spawnRadius");
const spawnPositionArea = document.getElementById("spawnPos");
const randomSelection = document.getElementById("randomisePlanet");
const randomSpawnAmount = document.getElementById("randomSpawnAmount");


const spawnPlanetBtn = document.getElementById("newPlanet");
const killPlanetBtn = document.getElementById("killPlanet");

console.log(spawnPlanetBtn);

let stdDev = 1.5;
let mean = 3.5;



spawnPlanetBtn.addEventListener("click", collectAndSpawn);
killPlanetBtn.addEventListener("click", kill);



function collectAndSpawn(){
	const spawnRadius = parseFloat(spawnRadiusInput.value);
	const posInputs = spawnPositionArea.querySelectorAll("input");
	const position = Array.from(posInputs)
		.filter(input => input.type === "number")
		.map(input => input.value);

	if(randomSelection.checked){
		if(randomSpawnAmount.value < 0) return;
		for(let i = 0; i < randomSpawnAmount.value; i++){

			const pos = Array.from({ length: 3 }, () => Math.random() * 200 - 100);
			let u = 0, v = 0;

			while(u === 0) u = Math.random();
			while(v === 0) v = Math.random();
			let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
			let radius = Math.min(Math.max(num * stdDev + mean, 1), 100);	
			App.createPlanet(radius, 64, 64, pos);
		}
	}else{
		App.createPlanet(spawnRadius, 64, 64, position);
	}
}




function kill(){
	App.killPlanet();	
}


