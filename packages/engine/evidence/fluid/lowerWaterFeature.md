# src/fluid/lowerWaterFeature.ts#lowerWaterFeature

## @evidence contracts/development/implementation.md#principled-implementation

Derives surface and spray from one state: step zero for static or the converted shot-time solve otherwise. This preserves one step within this returned frame, assuming an admitted unchanged domain; child numerical gaps are not repaired by composition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes solver, surface and spray and owns only mode selection and feature/domain identity. The returned frame does not carry mode; consumers can pass the binding's mode to the viewer as optional metadata.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A domain the feature does not bind is refused instead of drawn under the feature's name, and the camera distance default of zero is the documented nearest LOD, not a guess for a missing value.

## @evidence contracts/development/common.md#meaningful-documentation

States each mode's clock, static time bypass, actual viewer metadata use, identity/child refusals and caller admission limits; camera distance gives metres and default zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n steps, C cells, F faces, S sources, D drains and P returned particles, child replay, surface and spray cost O(C + F + n * (C + F + S + D) + emitters + P) time and O(C + F + P) storage under representable spray indices. Static still allocates a state and full surface; no cheap zero-step payload is assumed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one solved state between the surface and the spray of a frame instead of solving twice; nothing is reused across frames, so a renderer calling this per frame pays the stateless replay `simulateFluidDomain` documents.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned frame owns the state, the surface and the spray it carries.
