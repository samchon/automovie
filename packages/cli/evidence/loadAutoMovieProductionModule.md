# src/loadAutoMovieProductionModule.ts#loadAutoMovieProductionModule

## @evidence contracts/development/common.md#meaningful-documentation

States which packages it serves, why they come from the production, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation `createRequire` anchored at the production's `package.json` applies Node's resolution from that folder, the same copy the production's own scripts import.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One anchored require, its exports typed by the caller's declared module type `T`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No copy beside the command is tried, so a capture never draws with a renderer the production did not install.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolution; Node caches the module.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Node's module cache serves a second load of the same package.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The module stays in Node's cache for the process, as any import does.
