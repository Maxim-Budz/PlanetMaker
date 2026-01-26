import Renderer from './WebGL/Renderer.js';
import RenderPass from './Constants/RenderPass.js';
import ShaderManager from './WebGL/ShaderManager.js';
import ShaderProgram from './WebGL/ShaderProgram.js';
import TextureManager from './WebGL/TextureManager.js';
import Scene from './WebGL/Scene.js';

import Cube from './Shape/Cube.js';
import Sphere from './Shape/Sphere.js';

import CelestialBody from './CelestialBody.js'


import Planet from './Planet.js'
import Moon from './Moon.js'
import Star from './Star.js'

window.App = window.App || {};
const { mat4, vec3 } = glMatrix;
const statsDiv = document.getElementById("stats");

let renderer = null;
let shaderManager = null;
let textureManager = null;

let mainScene = null;

let gl = null;

let spheres = [];
//TODO eventually replace all just sphere with celestial body.
let celestialBodies = [];

export let currentSelection = -1;
export let selectedID = -1;
const canvas = document.getElementById("glCanvas");

let selectedModelId = "None";

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

	await shaderManager.load("planetShader",
        './shaders/Planet/planetVertex.glsl?',
        './shaders/Planet/planetFragment.glsl'
	);

	await shaderManager.load("planetGlowShader",
        './shaders/Planet/planetVertex.glsl?',
        './shaders/Planet/planetGlowFragment.glsl'
	);




	renderer.shaderManager = shaderManager;

	mainScene = new Scene(gl);

	renderer.currentScene = mainScene;

	textureManager = new TextureManager(gl);

	textureManager.load("star", "./assets/Textures/sunTextureBW2.png");
	textureManager.load("skybox", "./assets/Textures/starskybox.png");
	textureManager.load("surface", "./assets/Textures/surfaceTest.jpg");
	console.log(textureManager.textures);

	App.createSkybox();

	openMenuForModel("None");

}


async function main(){
	await init();


	const ambCol = document.getElementById("ambCol");
	const camSpeed = document.getElementById("camSpeed");
	const zoom = document.getElementById("zoom");

	ambCol.addEventListener("input", updateAmbient);
	[camSpeed,zoom].forEach(s => s.addEventListener("input", updateCamera));

	App.createPlanet(3.5, 64, 64, [0,0,0]);
	App.createMoon(1.0, 32, 32, [4,4,4], celestialBodies[0].id);
	App.createPlanet(7.5, 32,32, [-30, 20, 10]);
	
	App.createStar(60, 32, 32, [200,10,200], 0.6, [0.9,0.0,0.0], 
		[0.8,0.2,0.1, 1.0,0.6,0.2, 1.0,0.85,0.6, 1.0,1.0,0.9]);

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
		
		renderer.beginFrame();
		renderer.currentScene.submit(renderer);
		renderer.render(dt, selectedID);

		updateStats(now, renderer);
		
		last = now;

		requestAnimationFrame(loop);
	}
	loop();
}


//external functions
function updateAmbient() {
    mainScene.ambient = hexToVec(ambCol.value);
}

function updateCamera() {
	mainScene.camSpeed = parseFloat(camSpeed.value);
	mainScene.camHeight = parseFloat(zoom.value);
}
//TODO to be replaced
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

App.createMoon = function(radius, lat, lon, pos, parentID){
	if(!(gl && shaderManager && renderer)) return;
	let moon = new Moon(parentID);
	let sphere = new Sphere(gl, renderer,"planetShader", shaderManager, radius, lat, lon);
	sphere.texture = textureManager.textures.get("surface");
	sphere.position = pos;
	sphere.renderPass = RenderPass.GEOMETRY;
	spheres.push(sphere);
	moon.baseModel=sphere;	
	moon.selectPosition = pos;
	moon.selectRadius = radius;
	
	mainScene.addBody(moon);
	celestialBodies.push(moon);
}

App.createPlanet = function(radius, lat, lon, pos){

	if(!(gl && shaderManager && renderer)) return;
	let planet = new Planet();

	let sphere = new Sphere(gl, renderer,"planetShader", shaderManager, radius, lat, lon);
	textureManager.makePlanetTexture(planet.id);
	sphere.texture = textureManager.textures.get(planet.id);

	sphere.position = pos;
	sphere.renderPass = RenderPass.GEOMETRY; 

	spheres.push(sphere);

	planet.baseModel = sphere;
	//LOAD ATMOSPHERE ALSO
	sphere = new Sphere(gl, renderer,"planetGlowShader", shaderManager, radius*1.2, lat, lon);

	sphere.uniforms["uGlowColor"] = [0.26,0.53,0.96];
	sphere.uniforms["uGlowStrength"] = 1.0;
	sphere.uniforms["uRadius"] = radius;
	sphere.uniforms["uTransparency"] = 0.4;
	sphere.uniforms["uPlanetCenter"] = pos;

	sphere.renderPass = RenderPass.VFX; 
	sphere.position = pos;

	spheres.push(sphere);

	planet.atmosLayer = sphere;

	planet.selectPosition = pos;
	planet.selectRadius = radius;
	
	mainScene.addBody(planet);
	celestialBodies.push(planet);
}

//(MAX 4 COLOURS)
App.createStar = function(radius, lat, lon, pos, glowStrength, glowColor, mainColors){

	let star = new Star();

	let sphere = new Sphere(gl, renderer,"starShader", shaderManager, radius, lat, lon);

	sphere.uniforms["uGlowColor"] = glowColor;
	sphere.uniforms["uGlowStrength"] = glowStrength;
	sphere.uniforms["uRadius"] = radius;
	sphere.uniforms["uMainColors"] = new Float32Array(mainColors);
	sphere.renderPass = RenderPass.GEOMETRY; 

	sphere.texture = textureManager.textures.get("star");
	sphere.position = pos;	
	spheres.push(sphere);

	star.baseModel = sphere;
	
	sphere = new Sphere(gl, renderer,"starGlowShader", shaderManager, radius*1.4, lat, lon);

	sphere.uniforms["uGlowColor"] = glowColor;
	sphere.uniforms["uGlowStrength"] = glowStrength;
	sphere.uniforms["uRadius"] = radius;
	sphere.uniforms["uTransparency"] = 0.4;
	sphere.uniforms["uPlanetCenter"] = pos;
	sphere.renderPass = RenderPass.VFX; 
	sphere.position = pos;

	spheres.push(sphere);

	mainScene.addPointLight(pos, glowColor, glowStrength*100000.0, 252.0 + radius*radius);

	star.glowLayer = sphere;

	star.selectPosition = pos;
	star.selectRadius = radius;
	
	mainScene.addBody(star);
	celestialBodies.push(star);
}

App.createSkybox = function(){	

	let sphere = new Sphere(gl, renderer,"skyboxShader", shaderManager, 2000.0, 64, 64);

	sphere.texture = textureManager.textures.get("skybox");
	sphere.position = [0.0, 0.0, 0.0];
	sphere.frontFaceCull = true;
	sphere.renderPass = RenderPass.SKYBOX; 
	spheres.push(sphere);

	mainScene.skybox = sphere;
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
	checkSpheres(ray.origin, ray.dir); //TODO replace
	checkBodies(ray.origin, ray.dir); 
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


//Select Body code
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
		mainScene.focusPoint = picked.position;
	}else{
		currentSelection = -1;
		selectedID = null;
	}
}

function checkBodies(rayOrigin, rayDir){
	let closest = Infinity;
	let picked = null;

	for (const b of celestialBodies) {
		const t = raySphereHit(rayOrigin, rayDir, b.selectPosition, b.selectRadius);
		if (t !== false && t < closest) {
			closest = t;
			picked = b;
		}
	}

	if (picked) {
		//currentSelection = celestialBodies.indexOf(picked);
		//selectedID = picked.id;
		//renderer.focusPoint = picked.selectPosition;
		openMenuForModel(picked.type);
	}else{
		//currentSelection = -1;
		//selectedID = null;
		openMenuForModel("None");
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

function openMenuForModel(modelID){

	console.log("Opening menu:", modelID);

	document.querySelectorAll(".selected-model-menu").forEach(menu => {
		console.log("closing", menu.dataset.model);
		menu.classList.remove("open");
	});

	const menu = document.querySelector(
		`.selected-model-menu[data-model="${modelID}"]`
	);

	console.log("found menu:", menu?.dataset.model);

	if (menu){
		menu.classList.add("open");
	}
}


//HTML elements TODO move this to some other file
let last = performance.now();
let fps = 0;
let lastFPSUpdate = performance.now();

function updateStats(now, renderer) {

	frames++;

	if (now - lastFPSUpdate >= 1000) {
        fps = frames;
        frames = 0;
        lastFPSUpdate = now;
    }

    last = now;

    statsDiv.textContent =
		`FPS: ${fps.toFixed(1)}
		Draw Calls: ${renderer.drawCalls}`;
}



main();
