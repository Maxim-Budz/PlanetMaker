# Planet Maker

A WebGL project for rendering customizable planets with procedural terrain and a wide range of other options.

## Features

- Generate planets with procedural terrain  
- Customisable colour schemes  
- Real-time rendering with WebGL2

## To run

1. Clone the repository and move into the project folder:  
```bash
git clone https://github.com/Maxim-Budz/planet-maker.git
cd ./pathToProject
````

2. Start a local HTTP server while in the project folder:

```bash
python3 -m http.server 8080
```

3. Open your browser at:
   [http://localhost:8080](http://localhost:8080)
## To use
- Start by clicking on a planet to select it. Then you can customise terrain and add a colour scheme to it.
- To create a new planet use the options in the top right corner
## Planned updates
- Create light sources from the UI
- Improved terrain system
- Shadows
- Texture generation
- Animated weather effects & planet atmosphere
- Saving and loading scenes
- Better skybox

## Libraries Used

* **noisejs** – Perlin noise for procedural terrain
  [https://github.com/josephg/noisejs](https://github.com/josephg/noisejs)

* **gl-matrix** – Efficient matrix and vector operations
  [https://github.com/toji/gl-matrix](https://github.com/toji/gl-matrix)
