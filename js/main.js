import Renderer from './Renderer.js';

import ShaderManager from './ShaderManager.js';
import ShaderProgram from './ShaderProgram.js';

import TextureManager from './TextureManager.js';

import Cube from './Cube.js';
import Sphere from './Sphere.js';

window.App = window.App || {};
const { mat4, vec3 } = glMatrix;

let renderer = null;
let shaderManager = null;
let textureManager = null;

let gl = null;
let spheres = [];
export let currentSelection = -1;
export let selectedID = -1;
const canvas = document.getElementById("glCanvas");

async function init(){

    gl = canvas.getContext("webgl2");

    if (!gl) throw "WebGL2 not supported";

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	gl.enable(gl.DEPTH_TEST);
	gl.frontFace(gl.CCW);


	setup_mouse_events("glCanvas");

	renderer = new Renderer(gl);
	shaderManager = new ShaderManager(gl);

	//compiling and loading shaders

    await shaderManager.load("defaultShader",
        './shaders/vertex.glsl',
        './shaders/fragment.glsl' 
	);

    await shaderManager.load("starShader",
        './shaders/Star/starVertex.glsl?',
        './shaders/Star/starFragment.glsl'
	);

	await shaderManager.load("starGlowShader",
        './shaders/Star/starVertex.glsl?',
        './shaders/Star/starGlowFragment.glsl'
	);

	await shaderManager.load("skyboxShader",
        './shaders/Skybox/skyboxVertex.glsl?',
        './shaders/Skybox/skyboxFragment.glsl'
	);




	renderer.shaderManager = shaderManager;


    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

	textureManager = new TextureManager(gl);

	textureManager.load("star", "./assets/Textures/sunTextureBW2.png");
	textureManager.load("skybox", "./assets/Textures/starskybox.png");

	App.createSkybox()



	
}


async function main(){
	await init();


	const ambCol = document.getElementById("ambCol");
	const camSpeed = document.getElementById("camSpeed");
	const zoom = document.getElementById("zoom");

	ambCol.addEventListener("input", updateAmbient);
	[camSpeed,zoom].forEach(s => s.addEventListener("input", updateCamera));

	App.createPlanet(3.5, 64, 64, [0,0,0]);
	App.createPlanet(1.0, 32, 32, [4,4,4]);
	App.createPlanet(7.5, 32,32, [-30, 20, 10]);
	
	App.createStar(60, 32, 32, [200,10,200], 0.6, [0.9,0.0,0.0], 
		[1.0,1.0,0.9, 1.0,0.85,0.6, 1.0,0.6,0.2, 0.8,0.2,0.1]);

	App.createStar(20, 32, 32, [-200,10,-200], 0.6, [1.0,1.0,1.0], 
		[0.0,0.0,0.4, 0.2,0.3,0.8, 0.4,0.4,1.0, 1.0,1.0,1.0]);	
/*
	App.createStar(33, 32, 32, [200,-100,-200], 0.6, [1.0,0.0,1.0], 
		[0.4,0.0,0.4, 0.6,0.3,0.6, 0.7,0.4,0.7, 1.0,1.0,1.0]);


	App.createStar(100, 32,32, [-700.0, -100.0, 400.0], 0.6, [0.0,1.0,0.0],
		[0.0,0.4,0.0, 0.4,0.6,0.2, 0.4,0.7,0.2, 1.0,1.0,0.8]);

	App.createStar(14, 32,32, [10.0, -300.0, -8.0], 0.6, [1.0,1.0,0.0],
		[0.4,0.4,0.0, 0.6,0.6,0.2, 0.7,0.7,0.2, 1.0,1.0,0.8]);
*/


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
	console.log(terValues);
	if (currentSelection >= spheres.length || currentSelection < 0) return;
	spheres[currentSelection].octaves = terValues.octaves;
	spheres[currentSelection].lacunarity = terValues.lacunarity;
	spheres[currentSelection].persistence = terValues.persistence;
	spheres[currentSelection].frequency = terValues.frequency;
	spheres[currentSelection].amplitude = terValues.amplitude;

	spheres[currentSelection].construct();
	spheres[currentSelection].repaint(spheres[currentSelection].paintValues);
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

// Model functions
App.createPlanet = function(radius, lat, lon, pos){
	if(!(gl && shaderManager && renderer)) return;

	let sphere = new Sphere(gl, renderer,"defaultShader", shaderManager, radius, lat, lon);
	sphere.position = pos;
	spheres.push(sphere);
	renderer.addShape(sphere);
}


//MAX 4 COLOURS
App.createStar = function(radius, lat, lon, pos, glowStrength, glowColor, mainColors){	

	let sphere = new Sphere(gl, renderer,"starShader", shaderManager, radius, lat, lon);

	sphere.uniforms["uGlowColor"] = glowColor;
	sphere.uniforms["uGlowStrength"] = glowStrength;
	sphere.uniforms["uRadius"] = radius;
	sphere.uniforms["uMainColors"] = new Float32Array(mainColors); 
	sphere.texture = textureManager.textures.get("star");
	sphere.position = pos;	
	spheres.push(sphere);

	renderer.addShape(sphere);
	renderer.addPointLight(pos, glowColor, glowStrength*100000.0, 252.0 + radius*radius);

	
	sphere = new Sphere(gl, renderer,"starGlowShader", shaderManager, radius*1.4, lat, lon);

	sphere.uniforms["uGlowColor"] = glowColor;
	sphere.uniforms["uGlowStrength"] = glowStrength;
	sphere.uniforms["uRadius"] = radius;
	sphere.uniforms["uTransparency"] = 0.4;
	sphere.uniforms["uPlanetCenter"] = pos;
	sphere.position = pos;

	spheres.push(sphere);

	renderer.addShape(sphere);
	renderer.addPointLight(pos, glowColor, glowStrength*100000.0, 252.0 + radius*radius);
}

App.createSkybox = function(){	

	let sphere = new Sphere(gl, renderer,"skyboxShader", shaderManager, 2000.0, 64, 64);

	sphere.texture = textureManager.textures.get("skybox");
	sphere.position = [0.0, 0.0, 0.0];
	sphere.frontFaceCull = true;
	spheres.push(sphere);

	renderer.skybox = sphere;
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
		renderer.focusPoint = picked.position;
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
