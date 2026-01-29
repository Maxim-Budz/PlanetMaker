export default class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
		this.rngTextureNames = [];
        this.nextUnit = 0;
        this.maxUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

		let errorTextureData = this.generateErrorTexture();
		this.makeTextureFromRGBAArray("err", errorTextureData, 256, 128);

    }
//TODO cubemap texture loading
	load(name, source){
		const gl = this.gl;
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		 
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					  new Uint8Array([0, 0, 255, 255]));
		 
		var image = new Image();

		image.src = source;
		//image.onload = () => console.log("IMAGE LOADED", image.width, image.height, image.src);
		image.onerror = () => console.error("IMAGE FAILED TO LOAD", source);

	
		image.addEventListener('load', function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			
			if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
			
		});


		this.textures.set(name, texture);
	}

	makePlanetTexture(planetID, values){
		let data;

		switch(values.type){
			case "Swirl":
				data =  this.generateSwirlTexture(values.colors, values.strength);
				break;
			case "Ocean":
				data = this.generateOceanTexture(values.colors[0], values.colors[1], values.colors[2], values.bands, values.turbulence,
					values.cloudStrength, this.vertices, this.lonSeg, this.latSeg, 4);
				break;
			case "Terrain":
				data = this.generateTerrainTexture();//values.colors, values.thresholds, values.capCol, values.capSize);
				break;

			default:
				data = null;
				console.error("Invalid values for planet texture!")
				break;
		}	

		const seed = Math.floor(Math.random() * 1e9);
		//let data = this.generatePlanetTexture(seed);
		if(!data) return;
		this.makeTextureFromRGBAArray(planetID, data, 256, 128);
		//saveTextureAsPNG(planetID, 256, 128, data);
		this.rngTextureNames.push(planetID);
	}
	
	makeTextureFromRGBAArray(name, data, width, height){
		const gl = this.gl;
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

		if (isPowerOfTwo(data.width) && isPowerOfTwo(data.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		this.textures.set(name, texture);

	}

	generateTerrainTexture(seed, quality = 2, frequency=1.2, octaves=6, persistence=0.5, lacunarity=2.0, seaLevel=0.55){
		noise.seed(seed);
	

		const width		= 512*quality;
		const height	= 256*quality;

		const data = new Uint8Array(width * height * 4);

		function fbm(x, y, z) {
			let value = 0;
			let amp = 0.5;
			let freq = frequency;

			for (let i = 0; i < octaves; i++) {
				value += amp * noise.perlin3(x * freq, y * freq, z * freq);
				freq *= lacunarity;
				amp *= persistence;
			}
			return value;
		}

		let ptr = 0;

		for (let y = 0; y < height; y++) {
			const v = y / height;
			const phi = v * Math.PI;

			// Ice cap parameters
			const northStart = 0.0;      // start of solid ice (top)
			const northEnd = 0.12;       // start of fade
			const northLimit = 0.18;     // end of fade

			const southStart = 0.82;     // start of fade
			const southEnd = 0.88;       // end of solid ice (bottom)

			let iceFactor = 0;

			// North pole
			if (v < northEnd) {
				if (v < northStart) iceFactor = 1.0;                 // solid ice
				else iceFactor = 1.0 - (v - northStart) / (northEnd - northStart);  // fade
			}
			// South pole
			else if (v > southStart) {
				if (v > southEnd) iceFactor = 1.0;                   // solid ice
				else iceFactor = (v - southStart) / (southEnd - southStart);        // fade
			}

			iceFactor = Math.min(Math.max(iceFactor, 0), 1);


			for (let x = 0; x < width; x++) {
				const u = x / width;
				const theta = u * Math.PI * 2;

				const dx = Math.cos(theta) * Math.sin(phi);
				const dy = Math.cos(phi);
				const dz = Math.sin(theta) * Math.sin(phi);

				let h = fbm(dx, dy, dz);
				h = h * 0.5 + 0.5; // -1..1 -> 0..1

				let r, g, b;

				if (h < seaLevel) {
					// Ocean
					r = 20; g = 40; b = 120;
				}
				else if (h < seaLevel + 0.02) {
					// Beach
					r = 194; g = 178; b = 128;
				}
				else if (h < 0.7) {
					// Grass
					r = 50; g = 160; b = 60;
				}
				else if (h < 0.85) {
					// Mountains
					r = 120; g = 120; b = 120;
				}
				else {
					// Snow
					r = 240; g = 240; b = 240;
				}

				        // Mix in ice caps
				if (iceFactor > 0) {
					const iceR = 255;
					const iceG = 255;
					const iceB = 255;

					r = r * (1 - iceFactor) + iceR * iceFactor;
					g = g * (1 - iceFactor) + iceG * iceFactor;
					b = b * (1 - iceFactor) + iceB * iceFactor;
				}

				data[ptr++] = r;
				data[ptr++] = g;
				data[ptr++] = b;
				data[ptr++] = 255;
			}
		}

		return data;
	}

	generateSwirlTexture(colors, strength, width=256, height=128){

		if (colors.length == 0) {

			colors = randomColors();
			console.log(colors);

		}
		
		const data = new Uint8Array(width * height * 4);
		let count = colors.length/3;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {

				let u = x / (width - 1);
				let v = y / (height - 1);

				let theta = u * Math.PI * 2;   // longitude
				let phi   = v * Math.PI;       // latitude

				let px = Math.sin(phi) * Math.cos(theta);
				let py = Math.cos(phi);
				let pz = Math.sin(phi) * Math.sin(theta);

				let radius = 1.0;

				let angle = Math.atan2(pz, px);
				let spinT = (angle + Math.PI/2) / (2 * Math.PI);
				if (spinT < 0) spinT += 1;

				let latT = phi / Math.PI;

				let t = spinT + strength * latT;
				t = ((t % 1) + 1) % 1;

				let scaled = t * count;
				let index = Math.floor(scaled) % count;
				let nextIndex = (index + 1) % count;
				let localT = scaled - Math.floor(scaled);

				index *= 3;
				nextIndex *= 3;

				let r = lerp(colors[index],     colors[nextIndex],     localT);
				let g = lerp(colors[index + 1], colors[nextIndex + 1], localT);
				let b = lerp(colors[index + 2], colors[nextIndex + 2], localT);

				let i = (y * width + x) * 4;
				data[i]     = Math.floor(r * 255);
				data[i + 1] = Math.floor(g * 255);
				data[i + 2] = Math.floor(b * 255);
				data[i + 3] = 255;
			}
		}

		console.log(data);

		return data;
	}

	generateErrorTexture() {
		const width = 256;
		const height = 128;
		const checkerSize = 16;

		const data = new Uint8Array(width * height * 4);

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {

				const i = (y * width + x) * 4;

				const cx = Math.floor(x / checkerSize);
				const cy = Math.floor(y / checkerSize);
				const checker = (cx + cy) % 2;

				if (checker === 0) {
					data[i + 0] = 255; 
					data[i + 1] = 0;   
					data[i + 2] = 255; 
					data[i + 3] = 255; 
				} else {
					data[i + 0] = 0;
					data[i + 1] = 0;
					data[i + 2] = 0;
					data[i + 3] = 255;
				}
			}
		}
	return data;

	}

	generateOceanTexture(br,bg,bb, bands, turbulenceStrength, cloudStrength){
		let height = 128;
		let width = 256;
		const data = new Uint8Array(width * height * 4);	
		for(let y = 0; y<height; y++){
			for(let x = 0; x<width; x++){
				
				let u = x / (width-1);
				let v = y / (height-1);

				let theta = u * Math.PI * 2;
				let phi = v * Math.PI;

				let t = u;

				const cloud = (Math.sin(t * Math.PI * bands) * 0.5 + 0.5) * cloudStrength;
				const turbulence = (Math.random() - 0.05) * turbulenceStrength;
				let factor = cloud + turbulence;

				factor = Math.max(0, Math.min(1, factor));

				const r = br * (1 - factor) + 1.0 * factor;
				const g = bg * (1 - factor) + 1.0 * factor;
				const b = bb * (1 - factor) + 1.0 * factor;

				let i = (y * width + x) * 4;
				data[i]     = Math.floor(r * 255);
				data[i + 1] = Math.floor(g * 255);
				data[i + 2] = Math.floor(b * 255);
				data[i + 3] = 255;

			}
		}

		return data;
	}
	


}




function isPowerOfTwo(x) {
    return (x & (x - 1)) === 0;
}


function saveTextureAsPNG(name, width, height, data) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    const imageData = new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
    );

    ctx.putImageData(imageData, 0, 0);

    const link = document.createElement("a");
    link.download = name + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function randomColors(){
	let n = Math.floor(Math.random() * 5) + 1;

	const colors = [];

	for(let i = 0; i<n*3; i++){
		colors.push(Math.random());
	}

	return colors;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

