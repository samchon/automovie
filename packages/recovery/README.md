# @automovie/recovery

Recover editable curves from a reference mesh and use them to reconstruct geometry. Use it when you need a model you can deform or drive with parameters.

## Start

Use Node.js 22.23.2 or later.

```powershell
npm install @automovie/recovery @automovie/interface
```

1. Pass registered indexed triangles in millimetres to `AutoMovieRecoveryObservation.prepareInput`.
2. Fit and save the curve artifact returned by `AutoMovieRecoveryObservation.observeMesh`.
3. Pass the saved artifact to `AutoMovieRecoveryReconstruction.reconstructModel` for a model in metres.

A partial result includes usable geometry and diagnostics about unresolved domains. Check the status and diagnostics before adopting the model. See the [recovery guide](https://github.com/samchon/automovie/blob/master/.agents/skills/3d-modeling/crafting/recovery.md) and [API reference](https://samchon.github.io/automovie/api/).

Import shared data contracts such as `IAutoMovieRecoveryRegisteredInput` and `IAutoMovieRecoveryResult` from `@automovie/interface`. For file publication, use `IAutoMovieFileReceipt` and `IAutoMovieFilePublicationOptions` in place of the former `IAutoMovieRecoveryPublication` and `IAutoMovieRecoveryPublicationOptions` names.
