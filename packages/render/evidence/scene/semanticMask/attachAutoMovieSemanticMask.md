# src/scene/semanticMask/attachAutoMovieSemanticMask.ts#attachAutoMovieSemanticMask

## @evidence contracts/development/implementation.md#principled-implementation

Attaches the caller production design/palette binding to the actual scene userData key consumed by packaged mask selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scene handoff carries one existing binding across intermediate draw layers without adding public pass arguments or a global registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No attached fake coverage or material is generated; caller must provide the correct admitted binding, and attachment presence does not prove root or pixel coverage.

## @evidence contracts/development/common.md#meaningful-documentation

Documents why the scene owns the handoff and why an unattached asset host retains legacy ramp semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

One property assignment is fixed work and copies no scene, palette or shader data.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same actual binding can serve subsequent passes until scene/production replacement; replacement overwrites the reference and identity text alone does not preserve semantic validity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one binding reference is retained on the caller-owned scene; no geometry/material/renderer is acquired and scene/binding owner controls withdrawal or replacement.
