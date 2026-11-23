# src/perform/HumanPropFrame.ts#HumanPropFrame.parent

## @evidence contracts/development/common.md#meaningful-documentation

States the two input frames and the equation solved.

## @evidence contracts/development/implementation.md#principled-implementation

Right multiplication by the inverse rigid transform: R = R_world R_local^-1 and p = p_world - R p_local.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Normalizes the composed rotation, as compose does.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by placing and presenting demands instead of repeating the inverse-offset calculation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
