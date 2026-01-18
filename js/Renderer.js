const { mat3, mat4, vec3, vec4 } = glMatrix;

export default class Renderer {
    constructor(canvas) {

        this.gl = canvas.getContext("webgl2");
        if (!this.gl) throw "WebGL2 not supported";

        this.shapes = [];
        this.model = glMatrix.mat4.create();
        this.view = glMatrix.mat4.create();
        this.proj = glMatrix.mat4.create();


		this.camSpeed = 1.0;
		this.camHeight = 10.0;
		this.camPos = [10, -16, 10];
		
		this.lights = [
			{ position:[4,4,4], color:[1.0,0.0,0.0], intensity:1.0, distance:100.0},
			{ position:[-4,2,-4], color:[0.0,1.0,0.0], intensity:0.7, distance:7.0},
			{ position:[4,6,-4], color:[0.0,0.0,1.0], intensity:0.8, distance: 30.0},  
			{ position:[-4,0,4], color:[1.0,1.0,1.0], intensity:0.5, distance: 30.0},  
		];
		this.numLights = this.lights.length;


    }

	async init(vertexUrl, fragmentUrl) {
        const gl = this.gl;
		this.program = await this.loadShaders(vertexUrl, fragmentUrl);
        gl.useProgram(this.program);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);


		const lightPositions = [];
		const lightColors     = [];
		const lightIntensities = [];
		const lightDistances = [];

		for (let L of this.lights) {
			lightPositions.push(...L.position);
			lightColors.push(...L.color);
			lightIntensities.push(L.intensity);
			lightDistances.push(L.distance);
		}


		this.uNumLights      = gl.getUniformLocation(this.program, "uNumLights");
		this.uPointLightPositions      = gl.getUniformLocation(this.program, "uPointLightPositions");
		this.uPointLightColors         = gl.getUniformLocation(this.program, "uPointLightColors");
		this.uPointLightIntensities    = gl.getUniformLocation(this.program, "uPointLightIntensities");
		this.uPointLightDistances    = gl.getUniformLocation(this.program, "uPointLightDistances");


        this.uProj		= gl.getUniformLocation(this.program, "uProj");
        this.uView		= gl.getUniformLocation(this.program, "uView");
        this.uModel		= gl.getUniformLocation(this.program, "uModel");
		this.uTransparency = gl.getUniformLocation(this.program, "uTransparency");
        this.uView      = gl.getUniformLocation(this.program, "uView");
        this.uModel     = gl.getUniformLocation(this.program, "uModel");
		this.uNormal	= gl.getUniformLocation(this.program, "uNormal");
        this.uLightDir  = gl.getUniformLocation(this.program, "uLightDir");
        this.uLightColor= gl.getUniformLocation(this.program, "uLightColor");
        this.uAmbient   = gl.getUniformLocation(this.program, "uAmbient");
        this.uCamPos    = gl.getUniformLocation(this.program, "uCamPos");
        this.uShininess = gl.getUniformLocation(this.program, "uShininess");
        this.uSpecColor = gl.getUniformLocation(this.program, "uSpecColor");

		const normalMatrix = mat3.create();
		mat3.fromMat4(normalMatrix, this.model); // Start with model matrix
		mat3.invert(normalMatrix, normalMatrix);       // Invert
		mat3.transpose(normalMatrix, normalMatrix);    // Transpose
		gl.uniformMatrix3fv(this.uNormal, false, normalMatrix);

		gl.uniform1i(this.uNumLights, this.numLights);
		gl.uniform3fv(this.uPointLightPositions, new Float32Array(lightPositions));
		gl.uniform3fv(this.uPointLightColors, new Float32Array(lightColors));
		gl.uniform1fv(this.uPointLightIntensities, new Float32Array(lightIntensities));
		gl.uniform1fv(this.uPointLightDistances, new Float32Array(lightDistances));


        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		mat4.perspective(this.proj, 45 * Math.PI / 180, aspect, 0.1, 1000.0);
        glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(this.uProj, false, this.proj);
        gl.uniformMatrix4fv(this.uView, false, this.view);
        gl.uniform3fv(this.uCamPos, this.camPos);
        gl.uniform3fv(this.uLightDir, [0, 12.0, 10.0]);
        gl.uniform3fv(this.uLightColor, [1, 1, 1]);
        gl.uniform3fv(this.uAmbient, [0.3, 0.3, 0.3]);
        gl.uniform1f(this.uShininess, 31.0);
        gl.uniform3fv(this.uSpecColor, [1, 1, 1]);
		gl.uniform1f(this.uTransparency, 1.0);

		
		console.log("uApplyFresnel =", this.uApplyFresnel);
	}

    async loadShaders(vertexUrl, fragmentUrl) {
        const gl = this.gl;

        const vShader = await this.loadShader(vertexUrl, gl.VERTEX_SHADER);
        const fShader = await this.loadShader(fragmentUrl, gl.FRAGMENT_SHADER);
        const program = this.gl.createProgram();

        this.gl.attachShader(program, vShader);
        this.gl.attachShader(program, fShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
			return null;
        }
        return program;


    }

    async loadShader(url, type) {
        const res = await fetch(url);
		const src = await res.text();
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }



    addShape(shape) {
        this.shapes.push(shape);
    }

	removeShape(shapeID){
		this.shapes.splice(shapeID, 1);
	}

    render(elapsed, selectedID) {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//CAMERA ORBIT
		let t = performance.now() * 0.001;
		let theta = t * this.camSpeed;
		let phi = 0.6;

		const radius = Math.max(this.camHeight, 1.0);

		let camX = radius * Math.cos(phi) * Math.cos(theta);
		let camZ = radius * Math.cos(phi) * Math.sin(theta);
		let camY = radius * Math.sin(phi);

		this.camPos = [camX, camY, camZ];


		glMatrix.mat4.lookAt(this.view, this.camPos, [0, 0, 0], [0, 1, 0] );

        for (let shape of this.shapes) {
			gl.uniform1f(gl.getUniformLocation(this.program, "uTransparency"), shape.id === selectedID ? 0.4 : 1.0);

			shape.draw(this.view, this.proj, elapsed);
        }
    }


	makeRay(ndcX, ndcY){
		const invVP = mat4.create();
		mat4.multiply(invVP, this.proj, this.view);
		mat4.invert(invVP, invVP);

		const rayClip = vec4.fromValues(ndcX, ndcY, -1.0, 1.0);
		const rayWorld = vec4.create();
		vec4.transformMat4(rayWorld, rayClip, invVP);
		vec3.scale(rayWorld, rayWorld, 1 / rayWorld[3]);

		const origin = vec3.fromValues(this.camPos[0], this.camPos[1], this.camPos[2]);
		const dir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), rayWorld, origin));
		return { origin, dir };
	}















	setLightDirection([x,y,z]){
		const gl = this.gl;
		gl.uniform3fv(this.uLightDir, [x, y, z]);
	}

	setAmbientColor([r,g,b]){
		const gl = this.gl;
		console.log([r,g,b]);
		gl.uniform3fv(this.uAmbient, [r, g, b]);
	}

}

