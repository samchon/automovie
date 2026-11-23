# src/film/flame/heskestadFlameHeight.ts#heskestadFlameHeight

## @evidence contracts/development/common.md#meaningful-documentation

States the correlation, its units, its source and that a nonpositive result is refused by admission.

## @evidence contracts/development/implementation.md#principled-implementation

Heskestad's published luminous-height correlation for turbulent diffusion flames, evaluated as written.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One formula shared by admission and the shape sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping of a nonpositive height; admission refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar formula.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number only.
