import Shape from './Shape.js';
const { mat4, vec3 } = glMatrix;

export default class Sphere extends Shape {
    constructor(gl, renderer, shaderName, shaderManager, radius, latSeg, lonSeg) {
		super(gl, renderer, shaderName, shaderManager);
        
		this.latSeg = latSeg;
		this.lonSeg = lonSeg;
		this.radius = radius;

		this.paintValues = {};
		this.paintValues.colors = [0.145, 0.321, 0.678, 0.745, 0.678, 0.420, 0.173, 0.321, 0.157];
		this.paintValues.thresholds = [0.4, 0.7, 1.0];
		this.paintValues.capCol = [0.698, 0.698, 0.698];
		this.paintValues.capSize = 0.2;
		this.paintValues.type = "Terrain";


		this.frequency = 0.5;
		this.amplitude = 1.0;
		this.octaves = 3;
		this.lacunarity = 1.8;
		this.persistence = 0.5;


		
		this.init = false;
		if(shaderName == "starShader"){
			this.constructBasic()
		}else{
			this.construct();
		}


	}

	constructBasic(){
		this.vertices = [];
		this.normals = [];
		this.edges = [];
		this.uvs = [];
		
		//top pole
		for (let j = 0; j <= this.lonSeg; j++) {
			this.vertices.push(0, this.radius, 0);
			this.normals.push(0, 1, 0);
			this.uvs.push(j / this.lonSeg, 0);
		}
		//middle poles

		for (let i = 1; i < this.latSeg; i++){

			const theta = i * Math.PI / this.latSeg;
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for (let j = 0; j <= this.lonSeg; j++){
				const phi = j * 2 * Math.PI / this.lonSeg;
				const sinPhi = Math.sin(phi);
				const cosPhi = Math.cos(phi);

				const x = cosPhi * sinTheta;
				const y = cosTheta;
				const z = sinPhi * sinTheta;

				this.vertices.push(this.radius * x, this.radius * y, this.radius * z);
				this.normals.push(x, y, z);
				let u = j / this.lonSeg;
				if (j === this.lonSeg) u = 1.0;
				this.uvs.push(u, i / this.latSeg);

			}
		}

		//bottom pole
		for (let j = 0; j <= this.lonSeg; j++) {
			this.vertices.push(0, -this.radius, 0);
			this.normals.push(0, -1, 0);
			this.uvs.push(j / this.lonSeg, 1);
		}

		for (let lat = 0; lat < this.latSeg; lat++) {
			for (let lon = 0; lon < this.lonSeg; lon++) {

				const first = lat * (this.lonSeg + 1) + lon;
				const second = first + this.lonSeg + 1;

				this.indices.push(first, first + 1, second);
				this.indices.push(second, first + 1, second + 1);
			}
		}
		this.refillBuffers();
	}

	construct(){
		if (this.vertices.length > 0){
			this.vertices = [];
			this.normals = [];
			this.colors = [];
			this.edges = [];
			
		}

		// 1) generate vertices
		for (let i = 0; i <= this.latSeg; i++){
			const theta = i * Math.PI / this.latSeg;
			for (let j = 0; j <= this.lonSeg; j++){
				const phi = j * 2 * Math.PI / this.lonSeg;

				let x = this.radius * Math.sin(theta) * Math.cos(phi);
				let y = this.radius * Math.cos(theta);
				let z = this.radius * Math.sin(theta) * Math.sin(phi);

				const len = Math.hypot(x,y,z);

				let nx = x / this.radius;
				let ny = y / this.radius;
				let nz = z / this.radius;

				let h = fractalNoise(nx, ny, nz, this.octaves, this.lacunarity, this.persistence, this.frequency, this.amplitude);

				if (j == this.lonSeg){
					let p = this.latSeg * 3;
					let q = this.vertices.length - (p * 1.0);

					x = this.vertices[q];
					y = this.vertices[q+1];
					z = this.vertices[q+2];
					this.vertices.push(x, y, z);

				}else{
					const terrainScale=1.0;

					h = (h + 1) * 0.5;
					h = Math.pow(h, 2.0);

					let finalRadius = this.radius + h * terrainScale;

					x = nx * finalRadius;
					y = ny * finalRadius;
					z = nz * finalRadius;
					this.vertices.push(x, y, z);
				}
			}
		}
		
		//2) generate indices
		const indices = [];
		for (let lat = 0; lat < this.latSeg; lat++) {
			for (let lon = 0; lon < this.lonSeg; lon++) {
				const first = (lat * (this.lonSeg + 1)) + lon;
				const second = first + this.lonSeg + 1;

				indices.push(first, first + 1, second);
				indices.push(second, first + 1, second + 1);
			}
		}

		//3) generate normals
		this.normals = new Float32Array(this.vertices.length);

		for (let t = 0; t < indices.length; t += 3) {
        const i0 = indices[t] * 3;
        const i1 = indices[t + 1] * 3;
        const i2 = indices[t + 2] * 3;

        const v0 = [this.vertices[i0], this.vertices[i0 + 1], this.vertices[i0 + 2]];
        const v1 = [this.vertices[i1], this.vertices[i1 + 1], this.vertices[i1 + 2]];
        const v2 = [this.vertices[i2], this.vertices[i2 + 1], this.vertices[i2 + 2]];


        const e0 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const e1 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        let fn = cross(e0[0], e0[1], e0[2], e1[0], e1[1], e1[2]);
        fn = normalize(fn[0], fn[1], fn[2]);

        this.normals[i0]     += fn[0];
        this.normals[i0 + 1] += fn[1];
        this.normals[i0 + 2] += fn[2];

        this.normals[i1]     += fn[0];
        this.normals[i1 + 1] += fn[1];
        this.normals[i1 + 2] += fn[2];
		this.normals[i2]     += fn[0];
        this.normals[i2 + 1] += fn[1];
        this.normals[i2 + 2] += fn[2];
		}

		for (let i = 0; i < this.normals.length; i += 3) {
			const n = normalize(this.normals[i], this.normals[i + 1], this.normals[i + 2]);
			this.normals[i] = n[0];
			this.normals[i + 1] = n[1];
			this.normals[i + 2] = n[2];
		}

		this.vertexCount = this.vertices.length;
		this.indices = indices;
		

		//paint initial colors
		if (!this.init) {
			this.colors = this.paint(this.paintValues);
			this.init = true;
		}

		//Add data to buffers
		this.refillBuffers();
		this.rebindBuffers();

	}


	repaint(values){
		const gl = this.gl;
		this.paintValues = values;
		console.log(this.colors);
		this.colors = this.paint(values);
		console.log(this.colors);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);			

	}


	paint(values){
		switch(values.type){
			case "Swirl":
				return swirl(values.colors, values.swirlStrength, this.vertices, this.lonSeg, this.latSeg);
				break;
			case "Ocean":
				return ocean(values.colors[0], values.colors[1], values.colors[2], values.bands, values.turbulence,
					values.cloudStrength, this.vertices, this.lonSeg, this.latSeg, 4);
				break;
			case "Terrain":
				return terrain_paint(values.colors, values.thresholds, values.capCol, values.capSize, this.vertices);
				break;

			default:
				let output = [];
				for (let i = 0; i < this.vertices.length; i++){
					output.push(Math.random());
				}
				return output;
				break;
		}

	}


}

function fractalNoise(nx, ny, nz, octaves, lacunarity, persistence, frequency, amplitude) {
    let total = 0;
	noise.seed(Math.random());

    for (let i = 0; i < octaves; i++) {
		let base = noise.perlin3(nx*frequency, ny*frequency, nz*frequency) * amplitude;
		let mask = noise.perlin3(nx*frequency/5, ny*frequency/5, nz*frequency/5) * amplitude;
		total += base * mask;
        frequency *= lacunarity;
        amplitude *= persistence;
    }
    return total;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}


function lerpColor(c1, c2, t) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t)
  ];
}

function minMax(arr) {
  let min = Infinity;
  let max = -Infinity;

  for (let n of arr) {
    if (n < min) min = n;
    if (n > max) max = n;
  }
  return { min, max };
}


function terrain_paint(baseColors, thresholds, capColor, capSize, vertices){
	const output = [];
	const distances = [];

	for(let i = 0; i< vertices.length; i = i + 3){
		const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];


		const distance = Math.sqrt(x * x + y * y + z * z);
		distances.push(distance);
	}
	
	const extremes = minMax(distances);
	
	let dif = extremes.max - extremes.min;
	thresholds = thresholds.map(v => extremes.min + v * dif);
	console.log(thresholds);

	for(let i = 0; i < distances.length; i++){

		const phi = Math.acos(Math.max(-1, Math.min(1, vertices[3*i + 1]/distances[i])));

		if (phi < capSize || phi > 3.14 - capSize){
			output.push(capColor[0], capColor[1], capColor[2]);
		}else{
			let colorIdx = thresholds.findIndex(t => distances[i] < t);
			if (colorIdx === -1) colorIdx = thresholds.length - 1;
			colorIdx *= 3;
			const r = baseColors[colorIdx];
			const g = baseColors[colorIdx + 1];
			const b = baseColors[colorIdx + 2];
			output.push(r, g, b);
		}
	}
	return output;
}


function swirl(colors, strength, vertices, segments, divisor){
	let output = [];
	let count = colors.length/3;
	if (count == 1){
		
		for (let i = 0; i < vertices.length; i += 3) {
		  output.push(colors[0], colors[1], colors[2]);
		}
		return output;
	}
	for( let i = 0; i < vertices.length; i += 3){

		let radius = Math.hypot(vertices[i], vertices[i+1], vertices[i+2]);
		let angle = Math.atan2(vertices[i+2], vertices[i]);
		let spinT = (angle + Math.PI/2) / (2 * Math.PI);
		if (spinT < 0) spinT += 1;
		let phi = Math.acos(vertices[i+1] / radius);
		let latT = phi/Math.PI;
		let t = (spinT + strength * latT);
		t = t% 1;
		let scaled = t * (count);
		let index = Math.floor(scaled) % count;
		let nextIndex = (index + 1) % count;
		let localT = scaled - Math.floor(scaled);
		index *= 3;
		nextIndex *= 3;
        let r = lerp(colors[index], colors[nextIndex], localT);
        let g = lerp(colors[index+1], colors[nextIndex+1], localT);
        let b = lerp(colors[index+2], colors[nextIndex+2], localT);
		output.push(r,g,b);
	}
	console.log(output);
	return output;
}

function ocean(br, bg, bb, bands, turbulenceStrength, cloudStrength, vertices, segments, divisor){

	//const baseR = 0.1;
	//const baseG = 0.3;
	//const baseB = 0.6;
	
	let colors = [];
	for( let i = 0; i < vertices.length; i += 3){
		let t = ((i/3)% (divisor + 1)) / segments;
		const cloud = (Math.sin(t * Math.PI * bands) * 0.5 + 0.5) * cloudStrength;
		//const cloud = 0.3 * Math.sin(t * Math.PI * bands); // 8 stripes around sphere
		const turbulence = (Math.random() - 0.05) * turbulenceStrength;
		let factor = cloud + turbulence;

		const r = br * (1 - factor) + 1.0 * factor;
		const g = bg * (1 - factor) + 1.0 * factor;
		const b = bb * (1 - factor) + 1.0 * factor;

		colors.push(r, g, b);
	}

	return colors;

}


function cross(ax, ay, az, bx, by, bz) {
	return [
		ay * bz - az * by,
		az * bx - ax * bz,
		ax * by - ay * bx
	];
}

function normalize(x, y, z) {
	const len = Math.hypot(x, y, z);
	return len === 0 ? [0, 0, 0] : [x / len, y / len, z / len];
}
