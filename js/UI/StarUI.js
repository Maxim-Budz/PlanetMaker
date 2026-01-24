const spawnRadiusInput = document.getElementById("spawnRadius");
const spawnPositionArea = document.getElementById("spawnPos");
const colorPickerArea = document.getElementById("starColorArea");
const count = 0;

const spawnBtn = document.getElementById("spawn");
const killBtn = document.getElementById("kill");


spawnBtn.addEventListener("click", collectAndSpawn);
killBtn.addEventListener("click", kill);


function collectAndSpawn(){
	const spawnRadius = parseFloat(spawnRadiusInput.value);

	const posInputs = spawnPositionArea.querySelectorAll("input");
	const position = Array.from(posInputs)
		.filter(input => input.type === "number")
		.map(input => input.value);


}




function kill(){
	App.killStar();	
}



