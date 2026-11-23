# src/transformFormationBounds.ts#transformFormationBounds

## @evidence contracts/development/implementation.md#principled-implementation

An affine point transform maps the eight extrema, and per-axis minima/maxima produce the transformed AABB under finite representable inputs; rotation requires rebounding rather than transforming only min and max.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bounds compose the canonical formation point owner so placement and reporting use the same spacing, facing and translation semantics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arbitrary padding, consumer-specific envelope or input repair is added; extreme arithmetic and invalid authored boxes remain caller admission concerns.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world-space AABB output and delegation to the point transform, including its horizontal scale and degree-angle policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight point transforms plus fixed coordinate reductions take constant work and storage; repeated trig evaluations and small mapped arrays are paid within this owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same point rule is shared across all corners and consumers; no cheap fixed-size coefficient cache or mutable-bounds result cache is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh min/max vectors; corner and reduction arrays leave scope after completion and no renderer handle is retained.
