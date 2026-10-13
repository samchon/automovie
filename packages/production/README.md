# @automovie/production

Orchestrates a production: it compiles a project's typed declaration and source through the engine, binds authored documents into reader editions, captures and inspects frames, and plans and publishes renders, including the repaint lane. It has no network authoring surface.

What an authoring agent knows comes from its project and from what this package refuses: every refusal names the invariant it enforces and the correction that owns it.

## Use

```bash
npm install @automovie/production
```

| Entry | Purpose |
| --- | --- |
| `@automovie/production` | Building and inspecting a production (`openAutoMovieProduction`, `AutoMovieProductionBuilder`), reader editions (`AutoMovieProductionBinder`), capture, render jobs and their publication identity, repaint, and the diagnostic catalogue |
| `@automovie/production/validation` | Filesystem-free admission of scene and sequence artifacts (`validateSceneArtifact`, `validateSequenceArtifact`) |
