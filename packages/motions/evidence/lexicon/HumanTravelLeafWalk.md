# src/lexicon/HumanTravelLeafWalk.ts#HumanTravelLeafWalk.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the entry context, action duration, local taking instant and world-frame handle reader with their units.

## @evidence contracts/development/design.md#principled-representation

One action-local clock and a deterministic world point/normal reader describe the stance the held handle asks without duplicating the door's articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields supply every entry, timing and handle dependency the planner reads; geometry remains behind the supplied reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The path comes from the caller's held handle, never a named door, baked trajectory or invented sequence of stance points.

# src/lexicon/HumanTravelLeafWalk.ts#HumanTravelLeafWalk.IProps.handle

## @evidence contracts/development/common.md#meaningful-documentation

States the action-second input and returned world position and outward normal used to carry the taking stance.

## @evidence contracts/development/implementation.md#principled-implementation

A reader of the scene's own articulated handle, so the planner follows its path at every instant it asks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A reader contract only; the door law builds it and `plan` reads it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reader returns the handle at the second asked, never a cached or normalised one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A declaration; the reader the door law gives owns its cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A declaration that shares no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A declaration; `plan` calls it only while it builds and does not keep it.

# src/lexicon/HumanTravelLeafWalk.ts#HumanTravelLeafWalk.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The stances are the take relation carried with the handle; the hinge is the centre the leaf turns the stance about, solved from the first and last stances; the walk goes the feet's midpoint through them and is played at the share of its way the stance has gone, its cadence hurried at most to the walking gait's at the walk-to-run transition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stances, the end of the swing, the way, the hinge, the walk, the timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leaf that does not turn plans no walk; the walk's own refusals pass on.

## @evidence contracts/development/implementation.md#efficient-algorithms

One walk plan; the handle is read at every 24th of a second of the action and the walk's root at every 24th of its own, so construction is linear in the two durations, and each stance distance finds its place on the walk's distances by binary search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The root samples of the walk share one forward-kinematics reader; nothing is kept between plans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The handle reader and the sample arrays end with construction; the returned plan holds the walk and its clock of numbers.
