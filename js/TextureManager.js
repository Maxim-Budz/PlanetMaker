
export default class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
        this.nextUnit = 0;
        this.maxUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    }

    create(name) {
        const gl = this.gl;

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Debug pixel (pink)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1, 1, 0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255, 255])
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.textures.set(name, {
            texture: tex,
            unit: null,
            ready: false
        });

        return tex;
    }

    load(name, url) {
        const gl = this.gl;
        const entry = this.textures.get(name);

        if (!entry) throw new Error(`Texture ${name} not created`);

        const img = new Image();
        img.src = url;

        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, entry.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            // NPOT-safe
            if (this.isPowerOf2(img.width) && this.isPowerOf2(img.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }

            entry.ready = true;
        };
    }

    bind(name) {
        const gl = this.gl;
        const entry = this.textures.get(name);

        if (!entry) return null;

        if (entry.unit === null) {
            if (this.nextUnit >= this.maxUnits) {
                console.warn("Out of texture units");
                return null;
            }
            entry.unit = this.nextUnit++;
        }

        gl.activeTexture(gl.TEXTURE0 + entry.unit);
        gl.bindTexture(gl.TEXTURE_2D, entry.texture);

        return entry.unit;
    }

    isPowerOf2(v) {
        return (v & (v - 1)) === 0;
    }


	test(){

		const gl = this.gl;
		// Create a texture.
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		 
		// Fill the texture with a 1x1 blue pixel.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
					  new Uint8Array([0, 0, 255, 255]));
		 
		// Asynchronously load an image
		var image = new Image();
		image.src = "./assets/Textures/sunTextureBW2.png";
		image.onload = () => console.log("IMAGE LOADED", image.width, image.height);
		image.onerror = () => console.error("IMAGE FAILED TO LOAD");

	
		image.addEventListener('load', function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			
			// 1. Flip the Y axis (Standard for web textures)
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			
			// 2. Use this specific argument set for images
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			
			// 3. ONLY generate mipmaps if it's a Power of Two
			if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				// NPOT (Non Power of Two) strategy
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
			
			console.log("Texture updated successfully. GL Error:", gl.getError());
		});


		this.test_texture = texture;
	}
}



function isPowerOfTwo(x) {
    return (x & (x - 1)) === 0;
}
