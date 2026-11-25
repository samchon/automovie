# src/throwing/precisionThrow.ts#precisionThrow.windmill

## @evidence contracts/development/common.md#meaningful-documentation

Defines the authored arc and its landmarks. All points are in world metres, progress is in [0, 1].

## @evidence contracts/development/implementation.md#principled-implementation

Trace a vertical circle around the throwing shoulder's region, returning to the launch chamber. Blend only the approach from the held hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One local curve, one frame placement, then one entry blend.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The curve is measured in arm lengths and never moves the release or changes the launch clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the existing body frame and entry blend curve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/throwing/precisionThrow.ts#precisionThrow.stance

## @evidence contracts/development/common.md#meaningful-documentation

Describes the support frame, the provisional body-scaled depth and the unmodified carrier case.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the two displayed entry feet once and resolves bent knees over those fixed world placements as the pelvis descends. The release aim and played motion share this pose transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Early return outside solo bowling, then prepare both plants and apply one fraction of the lowering to each posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A carried performer retains its root and support owner. A grounded bowler does not lower by translating the feet or by shifting the ball after release.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two foot reads during preparation and fixed work per sampled posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the trunk owner's prepared planted leg goals for the same supports at each instant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one depth and at most two prepared foot goal readers for the action lifetime.

# src/throwing/precisionThrow.ts#precisionThrow.launches

## @evidence contracts/development/common.md#meaningful-documentation

Reads the local ball centre and radius from its grip. Explicit nonfixed attitudes continue through the original launch path.

## @evidence contracts/development/implementation.md#principled-implementation

The opt-in spherical flight shape uses the declared aperture and local grip centre without changing launch time, velocity or held origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Filter by the owning sport form then read the ball affordance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No assumed ball size and no replacement of explicit projectile attitude.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

At most one scan for a sized grip per launch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the canonical published launch and its sphere input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned array.
