# src/animals/EquineStanceMoves.ts#EquineStanceMoves.spin

## @evidence contracts/development/common.md#meaningful-documentation

States the turn, its pivot, the stepping order and the exit.

## @evidence contracts/development/implementation.md#principled-implementation

Each increment's anchors and trunk are the start's turned about the vertical through the hind hooves' middle (`AutoMovieArchetypeFrame.turn`); each hoof's step first moves the weight onto the other three (`EquineStanceSupport.transfer`), then swings the hoof on a lifted minimum-jerk path to its turned anchor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The increments' states, the events, then the pose by share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the stepping hoof leaves its anchor; the others stay planted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four weight transfers per increment, solved once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The states and loads are prepared once per plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its states.

# src/animals/EquineStanceMoves.ts#EquineStanceMoves.crowHops

## @evidence contracts/development/common.md#meaningful-documentation

States the repetition and where it ends.

## @evidence contracts/development/implementation.md#principled-implementation

The rows' own buck planned once (`EquineStanceRows.plan`) and played up and down once per hop, its share the square of the hop's half-sine so each hop starts and ends at rest; each buck support event is placed where a hop reaches its share, rising or falling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One buck, one repetition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hop is the buck's own geometry; nothing else is posed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One buck plan; a pose is one buck pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the buck's plan for every hop.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the buck's.

# src/animals/EquineStanceMoves.ts#EquineStanceMoves.setBack

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot, the planted hooves and the return.

## @evidence contracts/development/implementation.md#principled-implementation

The rows' own gather turn (`EquineBodyPose.turn` about the shoulders' joint midpoint, along the start trunk's heading), carried to `pitch`; every hoof placed on its start anchor so the hind legs fold under.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One turn, one blend.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hoof leaves its anchor.

## @evidence contracts/development/implementation.md#efficient-algorithms

One turn per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its two trunks.
