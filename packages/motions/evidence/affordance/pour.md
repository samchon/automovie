# src/affordance/pour.ts#pour.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the entry, retained hold and refusal categories.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist target is the pivot minus the rotated wrist-to-lip offset. Changing orientation therefore keeps the lip above the opening throughout the tip and righting goals. The lip and a point a hand's length up the vessel's axis are hard task limits within the held-tool bound, so the planned arm holds the lip and the tilt or refuses, instead of trading the attitude away.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admits the staging, constructs one arm trajectory, then checks the trajectory at the relevant phase samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derives the opening from the recipient's affordances and refuses sampled loss of alignment instead of moving the receiving vessel or changing the requested transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

One arm planning call and seven bounded forward pose reads per instance. Posture evaluation reads the prepared trajectory.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the vocabulary's rigid hold, arm carry, key clock, base composition and pose resolver.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains one trajectory and the rigid hold. There is no frame history or resource handle.

# src/affordance/pour.ts#pour.liquid

## @evidence contracts/development/common.md#meaningful-documentation

States the plan and time frame, the result's units and all refusal classes.

## @evidence contracts/development/implementation.md#principled-implementation

Discharge advances linearly within the authored flow interval. The recipient takes up to its remaining capacity, with excess counted as overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read both flow boundaries, clamp progress and distribute the discharged amount.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No liquid is added or removed independently of the source discharge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two lookups in the plan's events and constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the same named phase boundaries driving the motion.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure query that retains nothing.
