# src/reaction/staggerSwingBow.ts#staggerSwingBow

## @evidence contracts/development/common.md#meaningful-documentation

States the sampled curve, the clearance rule, the side, the bound and the units.

## @evidence contracts/development/implementation.md#principled-implementation

Two convex outlines on the floor are apart along an axis once their extents along it are disjoint; the bow moves every point of the swinging outline by the bow times its profile, so the least bow per sample is a closed-form ratio and the swing's bow the largest of them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The standing outline's extents, then one pass over the samples per side, then the side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The outlines are the body's soles and the bound two of its sole lengths; no constant is tuned and no leg fit stands in for the clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(k v) for k samples of a swing and v sole points: one prepared swing-curve read and one sole outline per sample, no leg fit and no search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The standing outline is read once for every sample; `StaggerFeet` keeps the bow for its step.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.
