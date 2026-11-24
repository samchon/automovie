# src/film/compilePracticalLightMotion.ts#compilePracticalLightMotion

## @evidence contracts/development/implementation.md#principled-implementation

Sample canonical per-channel prop authority once per key, apply affine emitter placement, aim a spot's negative Z along the scaled emitter direction, and express switching as half-open STEP keys; a flame-bound light instead takes one STEP intensity track on the flame's 1/120 s grid holding I_on · A / Ā inside `on`, so flicker and switching share one track and the inside mean is exactly I_on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The placement helper supplies affine position, the aim helper supplies shortest arcs, and canonical pointer properties and formatting supply the clip addresses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no independent authored light path or retiming. Piecewise interpolation only reproduces the exact prop attachment at requested samples, and unsupported light kinds and invalid times throw.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the source practice, staged-channel fallbacks, exact sample and switch semantics, shot clock, and the render path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorting S distinct pose times costs O(S log S). One track-address scan selects clips containing this prop. Each pose sample uses the shared clip sampler on that subset, including validation and key searches, then adds fixed-size arithmetic and key arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The relevant clip subset and fixed emitter basis are built once, and all emitted placement channels share one prop sample per time.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar arrays and clip metadata escape. Input records and temporary channel maps are not retained, and no render resources are allocated.
