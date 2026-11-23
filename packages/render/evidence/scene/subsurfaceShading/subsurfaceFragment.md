# src/scene/subsurfaceShading/subsurfaceFragment.ts#subsurfaceFragment

## @evidence contracts/development/implementation.md#principled-implementation

Uses the installed Three physical chunk, whose direct diffuse target is checked by subsurfacePhysicalChunk, and replaces the two expected outer include markers; flat shading keeps zero curvature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure source edit composes the checked lighting rewrite and curvature insertion without changing the global ShaderChunk registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not inspect native shader handles or special-case fixture outputs; absent outer markers can silently leave an incomplete patch and actual compilation/appearance is not proved by source rewriting.

## @evidence contracts/development/common.md#meaningful-documentation

States supported-template dependency, missing-marker limitation and unchanged flat/other lighting responsibilities.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads and rewrites chunk/template strings in O(chunk+fragment length), creating proportional output source; later native compilation remains outside this function.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared SDK chunk is read for each invocation; no source cache claims equivalence across changed SDK or other material patches.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns caller-owned source text and retains no shader, texture, program or render task.
