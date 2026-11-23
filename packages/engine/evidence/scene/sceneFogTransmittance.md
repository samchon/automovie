# src/scene/sceneFogTransmittance.ts#sceneFogTransmittance

## @evidence contracts/development/implementation.md#principled-implementation

Exponentiating the negative squared optical depth follows the viewer's FogExp2 attenuation law using axial camera depth; shader floating-point precision can differ from this binary64 calculation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Offline subject-contribution predictions share the atmosphere law selected by viewer fog construction, with color blending left to those consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null or absent fog explicitly means unit transmittance; density and depth are not adjusted to make a rendered prediction appear closer.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the exponential formula, camera-depth convention, behind-camera symmetry, absent-fog result and admitted-input precision limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two products, one negation and one exponential take constant time with no geometry traversal or allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Density and depth define one independent scalar query, so the function coordinates no repeated scene work or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned primitive retains no fog record, shader, renderer or temporary object after computation.
