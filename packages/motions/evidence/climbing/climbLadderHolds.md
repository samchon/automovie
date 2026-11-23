# src/climbing/climbLadderHolds.ts#climbLadderHolds.IHolds

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its index and frame.

## @evidence contracts/development/design.md#principled-representation

World placements and points by rung, and the arcs and paths between consecutive ones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five members climbLadder.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read-only after preparation.

# src/climbing/climbLadderHolds.ts#climbLadderHolds.IBounds

## @evidence contracts/development/common.md#meaningful-documentation

States each bound and its unit.

## @evidence contracts/development/design.md#principled-representation

The climb's own facing, toe-distance and grip-drop bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three bounds admit reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supplied by climbLadder's constants.

# src/climbing/climbLadderHolds.ts#climbLadderHolds.IAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

Lateral places in the ladder frame, metres, and a rung index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values climbLadder.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Computed only by admit.

# src/climbing/climbLadderHolds.ts#climbLadderHolds.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the checks, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the entry's feet in the ladder frame and the shoulder height in rungs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound per check, in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses rather than moves the climber.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/climbLadderHolds.ts#climbLadderHolds.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

A foot stands with its ball on the rung's top at its lateral place; a hand grips its rung in its shoulder's plane within the rung's width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Feet, their arcs and leg placements, then hands and their paths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every hold comes from the ladder's rungs and the body's rest geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the rungs climbed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each placement and arc is prepared once and shared by every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The arrays grow with the rungs climbed and are released with the plan.
