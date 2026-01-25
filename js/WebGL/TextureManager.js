export default class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
		this.rngTextureNames = [];
        this.nextUnit = 0;
        this.maxUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
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
		image.onload = () => console.log("IMAGE LOADED", image.width, image.height);
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

	makePlanetTexture(planetID){
		const seed = Math.floor(Math.random() * 1e9);
		let data = this.generatePlanetTexture(seed);
		this.makeTextureFromRGBAArray(planetID, data, 1024, 512);
		//saveTextureAsPNG(id, 1024, 512, data);
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
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		this.textures.set(name, texture);

	}

	generatePlanetTexture(seed, quality = 2, frequency=1.2, octaves=6, persistence=0.5, lacunarity=2.0, seaLevel=0.5){
		noise.seed(seed);
	

		const width	= 512*quality;
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
				else if (h < seaLevel + 0.05) {
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

				data[ptr++] = r;
				data[ptr++] = g;
				data[ptr++] = b;
				data[ptr++] = 255;
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

