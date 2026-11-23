# src/motion/assemblePlantedFeet.ts#assemblePlantedFeet

## @evidence contracts/development/implementation.md#principled-implementation

Replaces only motion.keyframes with the already solved dense frames and pairs it with detected stance records, preserving the original clip's duration and gait clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This final assembly seam packages the detection and re-key stages without duplicating IK, stance grouping or motion sampling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No residual is hidden or contact fabricated at assembly; the helper trusts the pass's parallel frames and plant records without modifying them.

## @evidence contracts/development/common.md#meaningful-documentation

States which clip fields persist and that supplied arrays and nested records are shared with the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shallow motion copy and one result object take constant work relative to keyframe and plant populations; no frame array is recopied.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The result directly shares completed keyframes and stance metadata from the owning pass rather than running detection or IK again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the assembled result and its borrowed arrays; the helper retains no additional state or disposal-capable resource.
