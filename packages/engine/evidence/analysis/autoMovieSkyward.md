# src/analysis/autoMovieSkyward.ts#autoMovieSkyward

## @evidence contracts/development/implementation.md#principled-implementation

Tests the dot product with normalized ground up using strict greater-than-zero, putting grazing directions on the ground side. The daylight caller supplies unit sampled directions, so its products stay bounded; arbitrary large directions are not normalized or admitted here and their dot sum can overflow or cancel to NaN.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate names the horizon rule the daylight sky estimate filters its directions with, kept apart from the hemisphere sampler because the ground and the workplane normal are independent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No direction or context is special-cased; the zero-up behavior is the math library's zero normalization, and the context validator refuses that input before any study runs.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the strict horizon rule, that neither vector needs unit length, the zero-up behavior and who refuses it, and why the elevation is ignored.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: one normalization and one dot product, with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The daylight analyzer evaluates it once per sky direction per study and keeps the skyward subset for every cell, instead of re-testing each direction at every cell, which is valid because the answer depends only on the direction and the study's ground.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one normalized vector per call and retains nothing.
