# @automovie/interface

Import the TypeScript contracts for AutoMovie's authored models, motions, scenes and films. Use the package to type the data you pass to AutoMovie libraries.

## Start

```powershell
npm install @automovie/interface
```

Use type-only imports. Start with `IAutoMovieModel` for a model, `IAutoMovieShot` for a shot or `IAutoMovieMotionHumanPerformance` for a human performance. Each field's documentation specifies units, coordinate frame and limits.

For model validation, use [`@automovie/engine`](https://github.com/samchon/automovie/tree/master/packages/engine). [API reference](https://samchon.github.io/automovie/api/).
