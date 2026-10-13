# @automovie/evidence

Turns a production's typed declaration (its kind, population scope, and branch stages) into the evidence graph `@wrtnlabs/evidence` checks, and reads that declaration back for `@automovie/production`. It validates the project's physical documents and source populations before returning a configuration; the production keeps its decisions and content in its own files.

## Use

```bash
npm install --save-dev @automovie/evidence
```

| Export | Purpose |
| --- | --- |
| `createAutoMovieEvidenceConfig`, `createAutoMovieStandaloneEvidenceConfig` | Validate the declaration and build the graph the evidence CLI evaluates |
| `readAutoMovieProductionEvidence` | Read the declaration's design branches, owners, and source bindings for production consumers |
| `createAutoMovieProductionPrincipleClaim`, `createAutoMovieProductionObligationClaim` | Add a production's own checklist or obligation to its graph |
