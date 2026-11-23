# src/striking/KneeReach.ts#KneeReach.ISolution

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

World points for the knee and the ankle, a world displacement for the pelvis, a horizontal unit heading and the shared reach status.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the plan poses and records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the reach status union.

# src/striking/KneeReach.ts#KneeReach.solve

## @evidence contracts/development/common.md#meaningful-documentation

States every input's frame and unit and the fallback's use; the comments derive the elevation and the travel.

## @evidence contracts/development/implementation.md#principled-implementation

The thigh's elevation from the arcsine of the target's height over the thigh-plus-patella radius, bounded by the hip's flexion range less the lean; then the horizontal travel that closes the remaining distance, bounded by the travel limit; the shank folded by the knee's flexion in the thigh's vertical plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Elevation, travel and status, then the joints, in one closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target outside the thigh's range or travel is reported short or jammed rather than reached by a stretched leg; 1e-9 tolerances only absorb rounding at the bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
