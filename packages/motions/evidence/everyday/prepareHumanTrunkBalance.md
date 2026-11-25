# src/everyday/prepareHumanTrunkBalance.ts#prepareHumanTrunkBalance

## @evidence contracts/development/common.md#meaningful-documentation

States the mass centre, support, axis and instant-scoped correction.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the canonical mass points and Jacobian to express the posed centre's horizontal arc. Each hull edge yields two trigonometric intersections. The least legal angle that enters the foot hull is used.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose and mass placement, one rigid-subtree reduction, and one scan of the arc's support-boundary intersections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The actual rig's mass, foot hull, lumbar axis and range apply. A centre already over the feet reads no correction, and an unattainable boundary stays visible to the audit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One current pose and O(M) segment work per active evaluation. The bounded sole hull has H edges. At most 2H closed-form candidates each test H half-planes, with no trial pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One posed mass point serves both the whole centre and the rotated subset. The body and its demanded FK setup are fixed for the plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the body's fixed model and FK names. Current posed frames and arc candidates are released on return.
