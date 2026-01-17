import Renderer from './Renderer.js';

import Cube from './Cube.js';
import Sphere from './Sphere.js';

window.App = window.App || {};
const { mat4, vec3 } = glMatrix;

let renderer = null;
let program = null;
let gl = null;
let spheres = [];



async function main(){
	const canvas = document.getElementById("glCanvas");
	renderer = new Renderer(canvas);
	await renderer.init('./shaders/vertex.glsl', './shaders/fragment.glsl');

	const ambCol = document.getElementById("ambCol");

	const lx = document.getElementById("lx");
	const ly = document.getElementById("ly");
	const lz = document.getElementById("lz");

	const camSpeed = document.getElementById("camSpeed");
	const zoom = document.getElementById("zoom");
	ambCol.addEventListener("input", updateAmbient);
	[lx, ly, lz].forEach(s => s.addEventListener("input", updateLight));
	[camSpeed,zoom].forEach(s => s.addEventListener("input", updateCamera));

	program = renderer.program;
	gl = renderer.gl;
	
	App.createPlanet(3.5, 64, 64, [0,0,0]);
	App.createPlanet(1.0, 32, 32, [4,4,4]);

	let last = performance.now();
	function loop() {
		const now = performance.now();
		const dt = (now - last) / 1000;
		last = now;
		renderer.render(dt);
		requestAnimationFrame(loop);
	}
	loop();
}


function updateLight() {
	if(!renderer) return;
    renderer.setLightDirection([
        parseFloat(lx.value),
        parseFloat(ly.value),
        parseFloat(lz.value)
    ]);
}


function updateAmbient() {
	if(!renderer) return;
    renderer.setAmbientColor(hexToVec(ambCol.value));
}


function updateCamera() {
	if(!renderer) return;
	renderer.camSpeed = parseFloat(camSpeed.value);
	renderer.camHeight = parseFloat(zoom.value);
}



App.updateTerrain = function(sphereID, terValues){
	if (sphereID >= spheres.length || sphereID < 0) return;
	spheres[sphereID].octaves = terValues.octaves;
	spheres[sphereID].lacunarity = terValues.lacunarity;
	spheres[sphereID].persistence = terValues.persistence;
	spheres[sphereID].frequency = terValues.frequency;
	spheres[sphereID].amplitude = terValues.amplitude;

	spheres[sphereID].construct();
	spheres[sphereID].repaint(spheres[sphereID].values);
}


App.updatePaint = function(sphereID, values){
	if (spheres.length < sphereID) return;
	spheres[sphereID].repaint(values);
}

function hexToVec(hex) {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return [r, g, b];
}

App.createPlanet = function(radius, lat, lon, pos){
	if(!(gl && program && renderer)) return;
	console.log("generating planet at " + pos);
	console.log("with radius " +radius);

	let sphere = new Sphere(gl, program, renderer, radius, lat, lon);
	sphere.position = pos;
	spheres.push(sphere);
	sphere.construct();
	renderer.addShape(sphere);
}

App.killPlanet = function(sphereID){
	if(!renderer || sphereID < 0 || sphereID >= spheres.length ) return;
	
	console.log("removing planet "+ sphereID);
	renderer.removeShape(sphereID);
	spheres.splice(sphereID,1);
}


main();
