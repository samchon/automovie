# @automovie/engine

Validate authored AutoMovie data and compute what a scene contains at a given time. Use the engine when your application needs scene evaluation, composition or physical playback.

## Start

```powershell
npm install @automovie/engine @automovie/interface
```

Import the engine functions from the package root and the authored types from `@automovie/interface`.

## Entry points

| Entry | Use |
| --- | --- |
| `AutoMovieEngineValidation.validateModel` | Check a model and read its field-level violations |
| `AutoMovieEngineFilm.stageScene`, `performShot`, `cutSequence` | Place a scene, perform a shot and assemble a sequence |
| `AutoMovieEnginePhysicalSimulation`, `AutoMovieEnginePhysicalPlayback` | Compute a simulation once and replay its saved result |

Run physical simulation in a build process or worker for an interactive application. See the [engine API](https://samchon.github.io/automovie/api/) and [rendering package](https://github.com/samchon/automovie/tree/master/packages/render).
