# src/animals/EquineRideTerrain.ts#EquineRideTerrain.ITerrain

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The plan, the footing and three readers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `prepare`, read by `rideQuadruped`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineRideTerrain.ts#EquineRideTerrain.ITerrain.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the limb, the film second, the gait's goal and the placement it takes and the goal it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Passes the footwork, the limb's two joints and the footing to EquineFootwork.limbGoal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to the footwork owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The techniques and the footing decide the goal; no gait goal is altered here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Its cost is that of EquineFootwork.limbGoal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads a different second.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineRideTerrain.ts#EquineRideTerrain.ITerrain.tail

## @evidence contracts/development/common.md#meaningful-documentation

States the model and placement it takes and the model it returns, the tail carried only when a bank face is met.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the model unchanged unless a bank or scramble meets a footing, then QuadrupedTail.carry over that footing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch and one delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tail carries only over an authored footing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Its cost is that of QuadrupedTail.carry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call poses a different model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh model and retains nothing.

# src/animals/EquineRideTerrain.ts#EquineRideTerrain.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, result and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The footwork reads the rig's neutral hooves, their stance centres under each attachment, the fore's reach and the tail; the footing is the course's own; the readers compose the techniques' and the footing's owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Footwork, footing, then the three readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepared once per ride; each reader is constant work outside a technique's window or an edge's reach.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `EquineFootwork`, `AutoMovieArchetypeQuadrupedFooting`, `QuadrupedCorner` and `QuadrupedTail`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan and footing for the ride's lifetime.
