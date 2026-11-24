# src/handling/pickUpStance.ts#pickUpStance.IChosen

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The three results the plan builds its postures from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by the plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An entry the body never left is a null stance, not an empty one.

# src/handling/pickUpStance.ts#pickUpStance.of

## @evidence contracts/development/common.md#meaningful-documentation

States the stages and the refusals passed on.

## @evidence contracts/development/implementation.md#principled-implementation

Each stage runs only where the one before leaves the grip, or the lift, out of reach, and the grasp is chosen again from each stance taken.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stages in order, each one guarded by the same reach test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

For a standing body the lowering is one candidate, tried as Algorithm 1 tries a base (`AutoMovieMotionHumanTouchStance.attempt`): its reach refusal leaves the turn and the step to try; any other refusal, and every refusal of a body that does not stand, is passed on.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains every original stance/grip-side search and full fit; each actual stance invokes the ordinary current-input search, including original use/demand callback admission rather than reusing cross-stance source assembly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Lowering, turning, stepping and whole-task lift candidates remain independent current computations. No immutability is inferred for the action context across external demand or stance callbacks, and the local search adapter stores no prepared geometry or fit answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous chooser releases its argument-binding callback and original tried-side list on return or throw. Returned chosen/stance/raise data retain no search preparation, FK workspace, callback map or query history.
