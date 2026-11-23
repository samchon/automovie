# src/motion/hingedReferenceInterval.ts#hingedReferenceInterval

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the swivel and distance units, score terms, fixed lower distance, nonnegative weight and closed interval.

## @evidence contracts/development/implementation.md#principled-implementation

The lower rotation is constant on a hinge branch. The upper moves by the swivel difference about one axis, so the triangle inequality bounds its distance by the midpoint distance minus half the width; the existing ROM tolerance covers angular roundoff.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The lower-only case adds its constant once per query, while a referenced upper adds a nonnegative scalar distance bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual branch and reference with its original positive weight. Neither the candidate rank nor the scored angular distance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One upper quaternion evaluation per distinct consecutive midpoint and constant work per bound query; the lower-only case evaluates no upper quaternion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Intervals shrinking around the same middle have the same branch orientation there; only the half-width changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned branch-local function retains two midpoint scalars and its geometric inputs until its owning search ends.
