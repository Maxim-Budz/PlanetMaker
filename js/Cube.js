import Shape from './Shape.js';
const { mat4, vec3 } = glMatrix;

export default class Cube extends Shape {
    constructor(gl, program, renderer) {
		super(gl, program, renderer);
        
        const vertices = new Float32Array([
            // front
            1,1,1, -1,1,1, -1,-1,1,
            1,1,1, -1,-1,1, 1,-1,1,
            // right
            1,1,1, 1,-1,1, 1,-1,-1,
            1,1,1, 1,-1,-1, 1,1,-1,
            // top
            1,1,1, 1,1,-1, -1,1,-1,
            1,1,1, -1,1,-1, -1,1,1,
            // left
            -1,1,1, -1,1,-1, -1,-1,-1,
            -1,1,1, -1,-1,-1, -1,-1,1,
            // bottom
            -1,-1,-1, 1,-1,-1, 1,-1,1,
            -1,-1,-1, 1,-1,1, -1,-1,1,
            // back
            1,-1,-1, -1,-1,-1, -1,1,-1,
            1,-1,-1, -1,1,-1, 1,1,-1
        ]);

        const faceNormals = [
            [0,0,1], [1,0,0], [0,1,0],
            [-1,0,0], [0,-1,0], [0,0,-1]
        ];
        const n = [];
        for (const norm of faceNormals) {
            for (let j=0;j<6;j++) n.push(...norm);
        }

        const normals = new Float32Array(n);

        this.vertexCount = 36;
		this.vertices = vertices;
		this.normals = normals;
	}
}

