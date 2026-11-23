# src/motion/ease.ts#ease

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the named polynomial or step curve after clamping finite progress to [0,1]; step changes exactly at the closed end and cubicBezier requires separate control-point evaluation, so this selector returns its linear progress.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An exhaustive curve switch owns named formulas; cubicBezierEasing owns inversion of a parameterized curve rather than adding unused control-point arguments here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite progress and unknown runtime curve names throw; the documented cubicBezier linear result is an explicit API limitation, not a consumer-specific substitution.

## @evidence contracts/development/common.md#meaningful-documentation

States normalized clamping, named-curve scope and the cubicBezier control-point seam.

## @evidence contracts/development/implementation.md#efficient-algorithms

Curve selection and each fixed polynomial/step formula take constant work and allocate no arrays or lookup structures.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

These scalar formulas have no retained cache; each current progress is evaluated directly.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains neither progress nor any external resource after completion or throw.
