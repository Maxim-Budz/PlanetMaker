const sphereSelect = document.getElementById("sphereID");


[octa, lacu, pers, freq, amp].forEach(s => s.addEventListener("input", collectAndUpdateTerrain));


function collectAndUpdateTerrain(){
	const sphereID = sphereSelect.value

	let values = {} 
	values.octaves = parseFloat(octa.value);
	values.lacunarity = parseFloat(lacu.value);
	values.persistence = parseFloat(pers.value);
	values.frequency = parseFloat(freq.value);
	values.amplitude = parseFloat(amp.value);

	App.updateTerrain(sphereID, values);



}



