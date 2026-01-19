import Renderer from './Renderer.js';

import Cube from './Cube.js';
import Sphere from './Sphere.js';

window.App = window.App || {};
const { mat4, vec3 } = glMatrix;

let renderer = null;
let program = null;
let gl = null;
let spheres = [];
export let currentSelection = -1;
export let selectedID = -1;
const canvas = document.getElementById("glCanvas");

async function init(){
    gl = canvas.getContext("webgl2");
    if (!this.gl) throw "WebGL2 not supported";
	setup_mouse_events("glCanvas");
	renderer = new Renderer(gl);
	shaderManager = new ShaderManager(gl);

	//loading shaders

    ShaderManager.load("defaultShader",
        await loadText('./shaders/vertex.glsl?v=' + Date.now());
        await loadText('./shaders/fragment.glsl?v=' + Date.now());

    ShaderManager.load("starShader",
        await loadText('./shaders/star/starVertex.glsl?v=' + Date.now()),
        await loadText('./shaders/star/starFragment.glsl?v=' + Date.now());

	renderer.addShader("default", defaultShader);

	
}


async function main(){

	setup_mouse_events("glCanvas");
	renderer = new Renderer(canvas);
	await renderer.init(
    './shaders/fragment.glsl?v=' + Date.now()
	);

	const ambCol = document.getElementById("ambCol");
	const camSpeed = document.getElementById("camSpeed");
	const zoom = document.getElementById("zoom");

	ambCol.addEventListener("input", updateAmbient);
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
		renderer.render(dt, selectedID);
		requestAnimationFrame(loop);
	}
	loop();
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

App.updateTerrain = function(terValues){
	if (currentSelection >= spheres.length || currentSelection < 0) return;
	spheres[currentSelection].octaves = terValues.octaves;
	spheres[currentSelection].lacunarity = terValues.lacunarity;
	spheres[currentSelection].persistence = terValues.persistence;
	spheres[currentSelection].frequency = terValues.frequency;
	spheres[currentSelection].amplitude = terValues.amplitude;

	spheres[currentSelection].construct();
	spheres[currentSelection].repaint(spheres[currentSelection].values);
}


App.updatePaint = function(values){
	if (spheres.length < currentSelection) return;
	spheres[currentSelection].repaint(values);
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

App.killPlanet = function(){
	if(!renderer || currentSelection < 0 || currentSelection >= spheres.length ) return;
	
	console.log("removing planet "+ currentSelection);
	renderer.removeShape(currentSelection);
	spheres.splice(currentSelection,1);
}

//Mouse & selecting code

export function mouse_pressed(x, y){
}

export function mouse_moved(x, y){
}

export function mouse_released(x, y){
	let ndcCoords = toNDC(x,y,canvas);
	let ray = renderer.makeRay(ndcCoords[0], ndcCoords[1]);
	checkSpheres(ray.origin, ray.dir);
}

globalThis.mouse_pressed  = mouse_pressed;
globalThis.mouse_moved    = mouse_moved;
globalThis.mouse_released = mouse_released;

function toNDC(x, y, canvas) {
	if(!canvas) return;
	const rect = canvas.getBoundingClientRect();

	const ndcX = (x/ rect.width ) * 2 - 1;
	const ndcY = -((y/ rect.height) * 2 - 1);
	return [ndcX, ndcY];
}


function checkSpheres(rayOrigin, rayDir){
	let closest = Infinity;
	let picked = null;

	for (const s of spheres) {
		const t = raySphereHit(rayOrigin, rayDir, s.position, s.radius);
		if (t !== false && t < closest) {
			closest = t;
			picked = s;
		}
	}

	if (picked) {
		currentSelection = spheres.indexOf(picked);
		selectedID = picked.id;
	}else{
		currentSelection = -1;
		selectedID = null;
	}

	

}

function raySphereHit(rayOrigin, rayDir, center, radius) {
    const oc = vec3.create();
    vec3.subtract(oc, rayOrigin, center);

    const a = vec3.dot(rayDir, rayDir);
    const b = 2.0 * vec3.dot(oc, rayDir);
    const c = vec3.dot(oc, oc) - radius * radius;

    const disc = b * b - 4 * a * c;

    if (disc < 0) return false;

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    const t = Math.min(t1, t2);
    return t >= 0 ? t : false;
}





main();
