const typeSelect = document.getElementById("paintType");
const configArea = document.getElementById("configArea");
const paintBtn = document.getElementById("paintBtn");

let maxThresholdLevel = 0;
let thresholds = [];

typeSelect.addEventListener("change", () => renderOptions(typeSelect.value));
paintBtn.addEventListener("click", collectAndPaint);

function renderOptions(type) {
  configArea.innerHTML = "";
  paintBtn.classList.add("hidden");

  if (!type) return;


	if (type === "Swirl") showSwirlControls();
	if (type === "Ocean") showOceanControls();
	if (type === "Terrain") showTerrainColorControls();

	collectAndPaint();

  paintBtn.classList.remove("hidden");
}

function showColorControls() {
  const div = document.createElement("div");
  div.innerHTML = `<h3>Colours</h3>`;
  div.id = "colorsBlock";

  const container = document.createElement("div");
  container.id = "colorContainer";
  div.appendChild(container);

  const add = document.createElement("button");
  add.textContent = "Add Colour";
  add.onclick = addColorPicker;

  const remove = document.createElement("button");
  remove.textContent = "Remove Colour";
  remove.onclick = removeColorPicker;

  div.appendChild(add);
  div.appendChild(remove);

  configArea.appendChild(div);

  addColorPicker();
}

function showNumberControls(name) {
  const div = document.createElement("div");
  div.innerHTML = `<h3>${name}</h3>`;
  div.id = "numberBlock";

  const container = document.createElement("div");
  container.id = "numberContainer";
  div.appendChild(container);

  const add = document.createElement("button");
  add.textContent = "Add "+name;
  add.onclick = addNumberPicker;

  const remove = document.createElement("button");
  remove.textContent = "Remove "+name;
  remove.onclick = removeNumberPicker;

  div.appendChild(add);
  div.appendChild(remove);

  configArea.appendChild(div);

  addColorPicker();
}

function showColorThresholdsControls() {
  const div = document.createElement("div");
  div.innerHTML = `<h3>Colour Thresholds</h3>`;
  div.id = "threshBlock";

  const container = document.createElement("div");
  container.id = "colorContainer";
  div.appendChild(container);

	const add = document.createElement("button");
	add.textContent = "Add Colour";
	add.addEventListener("click", addColorPicker);
	add.addEventListener("click", addNumberPicker);

	const remove = document.createElement("button");
	remove.textContent = "Remove Colour";
	remove.addEventListener("click", removeColorPicker);
	remove.addEventListener("click", removeNumberPicker);

	div.appendChild(add);
	div.appendChild(remove);

	configArea.appendChild(div);

	addColorPicker();
	addNumberPicker();
}

function showControl(name, id, type, min, max, step, value){

  const picker = document.createElement("div");
  picker.innerHTML = `
    <h3>${name}</h3>
    <input id="${id}" type="${type}" value="${value}" step="${step}" min="${min}" max="${max}">
  `;
  configArea.appendChild(picker);
	picker.addEventListener("input", collectAndPaint );

}

function showSwirlControls(){
	showColorControls();
	showControl("Swirl strength", "swirlStrength", "range", 0, 30, 0.3, 3.0);
}

function showOceanControls() {
	showColorControls();
	showControl("Bands", "bands", "number", 0, 20, 1, 4);
	showControl("Turbulence", "turbulence", "range", 0, 2, 0.01, 0.2);
	showControl("Cloud Strength", "cloudStrength", "range", 0, 1, 0.01, 0.1);
}

function showTerrainColorControls() {
	showColorThresholdsControls();
	const picker = document.createElement("div");
	picker.innerHTML = `
		<h3>Cap Colour</h3>
		<input id="capCol" type="color" value="#B2B2B2">
	`;
	configArea.appendChild(picker);

	showControl("Cap size", "capSize", "range", 0, 1, 0.01, 0.18);

	
}

function addColorPicker() {
	if (maxThresholdLevel == 1) return;

	const container = document.getElementById("colorContainer");
	const wrapper = document.createElement("div");
	wrapper.className = "color-row";

	const input = document.createElement("input");
	input.type = "color";
	input.value = randomHexColor();

	wrapper.appendChild(input);
	container.appendChild(wrapper);
	input.addEventListener("input", collectAndPaint);

	collectAndPaint();
}

function removeColorPicker() {
	const container = document.getElementById("colorContainer");
	if (container.lastChild) container.removeChild(container.lastChild);
	collectAndPaint();
}

function addNumberPicker() {

	console.log(maxThresholdLevel)
	if (maxThresholdLevel == 1){
		alert("Cannot add more colours, threshold is at maximum");
		return;
	}
	const container = document.getElementById("colorContainer");
	const wrapper = document.createElement("div");
	wrapper.className = "number-row";

	const input = document.createElement("input");
	input.type = "number";
	input.className = "threshold-value";
	//input.placeholder = maxThresholdLevel;
	input.value = maxThresholdLevel;
	input.step = "0.01";
	input.name = thresholds.length;

	if (thresholds.length == 0){
		input.min = "0.0";
		input.max = 0.1;
	}else{
		input.min = parseFloat(thresholds[thresholds.length-1].value) + 0.01;
		input.max = "1.0";
		thresholds[thresholds.length-1].max = parseFloat(input.value) - 0.1;
	}

	wrapper.appendChild(input);
	container.appendChild(wrapper);

	thresholds.push(input);

	maxThresholdLevel = Math.min(1.0, parseFloat(thresholds[thresholds.length - 1].value) + 0.1);
	input.addEventListener("input", collectAndPaint);
	input.addEventListener("input", handleMinMaxThresholds);
	collectAndPaint();
}

function handleMinMaxThresholds(evt){
	let target = evt.currentTarget;

	let index = parseInt(target.name);

	if (index < 0 || index >= thresholds.length){
		console.log("ERROR thershold index is out of bounds");
		console.log(index + " is invalid!!");
	} 
	else if(index == 0){
		thresholds[index + 1].min = parseFloat(target.value) + 0.01;

	}else if(index == thresholds.length - 1){
		thresholds[index - 1].max = parseFloat(target.value) - 0.01;
		maxThresholdLevel = Math.min(1.0, parseFloat(target.value) + 0.1);
	}else{
		thresholds[index + 1].min = parseFloat(target.value) + 0.01;
		thresholds[index - 1].max = parseFloat(target.value) - 0.01;
	}
}

function removeNumberPicker() {
	const container = document.getElementById("colorContainer");
	if (container.lastChild) container.removeChild(container.lastChild);
	if (thresholds.length > 0){
		thresholds.pop();
		maxThresholdLevel = Math.min(1.0, parseFloat(thresholds[thresholds.length - 1].value) + 0.1);
		thresholds[thresholds.length-1].max = "1.0";
	}
	collectAndPaint();
}

function randomHexColor() {
  return "#" + Math.floor(Math.random() * 0xffffff)
    .toString(16).padStart(6, "0");
}

function hexToVec(hex) {
	console.log(hex);
	if (typeof hex !== 'string') {
        console.error("Expected string but got:", hex);
        return [0, 0, 0]; 
	}
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return [r, g, b];
}

function collectAndPaint() {
	const type = typeSelect.value;
	const controls = configArea.querySelectorAll("input, select, textarea");
	

	const values = {};
	controls.forEach(control => {
		if (control.type === "checkbox") {
			values[control.id] = control.checked;
		} else if (control.type === "range" || control.type === "number" || control.type === "text") {
			values[control.id] = parseFloat(control.value);
		}else if (control.type === "color") {
			values[control.id] = hexToVec(control.value);
		} else {
			values[control.id] = control.value;
		}
	});

	const allInputs = configArea.querySelectorAll("#colorContainer input");

	const colors = Array.from(allInputs)
		.filter(input => input.type === 'color')
		.map(input => hexToVec(input.value))
		.flat();

	const thresholds = Array.from(allInputs)
		.filter(input => input.type === 'number')
		.map(input => parseFloat(input.value) || 0);



	values.type = type;
	values.colors = colors;
	values.thresholds = thresholds;

	console.log(values);

	App.updatePaint(values);
}

