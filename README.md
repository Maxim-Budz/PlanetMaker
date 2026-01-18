# Planet Maker

A WebGL project for rendering customizable planets with procedural terrain and a wide range of other options.

## Features

- Generate planets with procedural terrain  
- Customisable colour schemes  
- Real-time rendering with WebGL2

## To run

1. Clone the repository:  
```bash
git clone https://github.com/Maxim-Budz/planet-maker.git
cd ./pathToProject
````

2. Start a local HTTP server:

```bash
python3 -m http.server 8080
```

3. Open your browser at:
   [http://localhost:8080](http://localhost:8080)

## Libraries Used

* **noisejs** – Perlin noise for procedural terrain
  [https://github.com/josephg/noisejs](https://github.com/josephg/noisejs)

* **gl-matrix** – Efficient matrix and vector operations
  [https://github.com/toji/gl-matrix](https://github.com/toji/gl-matrix)
