# src/validation/validateTextureScale.ts#validateTextureScale

## @evidence contracts/development/implementation.md#principled-implementation

Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

materialTextureSlots enumerates bindings and surfaceSpan reads UVs; each model indexes material ids once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Primitives, absent/degenerate UVs, legacy ids, omitted/source-uv coordinates and clamped axes are intentionally exempt.

## @evidence contracts/development/common.md#meaningful-documentation

Relative tile slack and normalized absolute1e-9 slack, error/warning distinction and slot paths are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

V UV values plus material/part/slot populations drive linear scans and map lookup, with per-part span computation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each part's UV span serves all bindings and each model's id map serves all parts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only diagnostics escape; UVs/materials are borrowed and no world-space fit, UV rewrite or texture resource is acquired.
