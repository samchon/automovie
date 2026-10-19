# Recovery repository commands

The maintained library and installed CLI live in [`@automovie/recovery`](../../packages/recovery/README.md). Recovery-specific algorithms, observation helpers, fitting and reconstruction now belong to that package. Existing shared curve and surface mathematics remains in the engine.

The five TypeScript entrypoints here forward old repository commands to the package's Node dispatcher and retain the `RUN_SOURCE_EPOCH` environment handoff. They contain no reconstruction algorithms. New installed consumers use `automovie-recovery` with an explicit `--source-epoch` option.

`verifyAutoMovieRecoveryPackage.ts` is a repository integration check for packed JavaScript, declarations and the installed CLI in an external consumer. It is not part of the public runtime or the portable unit suite. Compilation belongs to the shared repository compiler; the old relocated-module build and module-boundary repair are retired.

The package README documents units, partial outcomes, unsupported domains and the baseline's unresolved visual limitations. Moving these tools does not regenerate or improve an existing model.
