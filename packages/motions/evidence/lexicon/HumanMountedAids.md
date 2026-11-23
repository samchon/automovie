# src/lexicon/HumanMountedAids.ts#HumanMountedAids.IGiven

## @evidence contracts/development/common.md#meaningful-documentation

kind, side: The aid's. onset: When it begins, local seconds. at: The transition, local seconds.

## @evidence contracts/development/design.md#principled-representation

Seconds on the action's clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the weights and the events.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanMountedAids.ts#HumanMountedAids.given

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each aid's cue instants inside the performance become transitions, each given its latency's head start; the required track's instants are each matched to a given aid.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop per aid.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An aid that cannot begin inside the performance is refused, never shortened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cue instants after one sort.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list.

# src/lexicon/HumanMountedAids.ts#HumanMountedAids.weight

## @evidence contracts/development/common.md#meaningful-documentation

States the profile.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk rise and fall (Flash and Hogan 1985) around a held plateau.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedAids.ts#HumanMountedAids.rein

## @evidence contracts/development/common.md#meaningful-documentation

States each hand aid's movement.

## @evidence contracts/development/implementation.md#principled-implementation

The rein's own axis for a take-up, the horizontal across it, outward or inward by the hand's side, for an opening or a neck rein, a vertical sine of `WAVES` waves for a shake, and the axis tipped up for a whip touch, each scaled by its aid's weight.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass over the aids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip without an axis is moved only across.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the aids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedAids.ts#HumanMountedAids.body

## @evidence contracts/development/common.md#meaningful-documentation

States each leg and seat aid's movement and its pivot.

## @evidence contracts/development/implementation.md#principled-implementation

A foot turn about the ball's vertical (squeeze) or lateral (kick) axis, the ball held still so the sole keeps its stirrup; the pelvis pitch reduced by the seat aid's tip.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass over the aids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg goal with no contact or rotation is left as it is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the aids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
