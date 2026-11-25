# src/reaction/environmentRailCatch.ts#environmentRailCatch

## @evidence contracts/development/common.md#meaningful-documentation

States the stances, the grip point, timing, load and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The grip point is the closed-form nearest point of the finite bar segment to the shoulder; reach is the straight arm's length with slack; the stances are fitted by the shared support law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bar admission, grip point, three stances, then the support plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable or moving bar refuses instead of clamping the hand.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant geometry and three support fits at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the support plan.
