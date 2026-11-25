# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.IMove

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its timebase.

## @evidence contracts/development/design.md#principled-representation

A timed move from one level to the next.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the frame reader and the hand carry read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Times follow from the step's own seconds.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.IClimb

## @evidence contracts/development/common.md#meaningful-documentation

States each member with its unit.

## @evidence contracts/development/design.md#principled-representation

The flight's direction, riser, tread and first nosing with the step clock and crutch moves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the plan and the track read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Defaults are the stair climb's own.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.resolve

## @evidence contracts/development/common.md#meaningful-documentation

States the bounds, the defaults, the orders and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The single-leg step-up bounds of the stair climb and a step clock split in halves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bounds, then the moves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A track without a body skips only the body's bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The plan and each track resolve from the same inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh climb and retains nothing.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.level

## @evidence contracts/development/common.md#meaningful-documentation

States the offset's axes and the tread share.

## @evidence contracts/development/implementation.md#principled-implementation

The k-th tread's height and the point `ON` of its going back from its nosing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the flight's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.frameAt

## @evidence contracts/development/common.md#meaningful-documentation

States the planted and moving cases and the path's order.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk rises and travels in sequence so the tip clears the nosing before it travels over it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan for the current move.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The path's phase shares are provisional staging, stated in the course.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the moves up to the current one.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is its own second's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh frame and retains nothing.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.arrived

## @evidence contracts/development/common.md#meaningful-documentation

States what is counted and when a tread counts.

## @evidence contracts/development/implementation.md#principled-implementation

A window opens at its foot's set-down key, which lies after its foot stance's start and before the next one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One count over the steps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read at the window's opening, never its middle, so the last window counts its own tread.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchStairsFlight.ts#crutchStairsFlight.profile

## @evidence contracts/development/common.md#meaningful-documentation

States the climb, the entry floor and the levels returned.

## @evidence contracts/development/implementation.md#principled-implementation

The flight's own geometry. The entry floor runs to the first nosing. Each tread begins at its nosing, `start + i tread` ahead of the toes, one riser above or below the level before (`sign`), the same treads `level` sets each foot and tip on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One level per crutch move after the entry floor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The climb's own riser, tread, start and direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(count), once per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh levels.
