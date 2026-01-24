export default class TextureManager {
    constructor(gl) {
        this.gl = gl;
        this.textures = new Map();
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
			
			console.log("Texture updated successfully. GL Error:", gl.getError());
		});


		this.textures.set(name, texture);
	}



	}




function isPowerOfTwo(x) {
    return (x & (x - 1)) === 0;
}
