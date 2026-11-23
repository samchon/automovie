# src/gym/createBalanceBeam.ts#createBalanceBeam

## @evidence contracts/development/implementation.md#principled-implementation

The six section corners extrude into one convex volume. Its top edge and length define the same rectangular support that the feet and palms read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, extrude the section, add the two supports and publish the top.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The collision hull follows the competition section's changing width. The sides and support feet are coarse. Mass uses the maker's shipping weight as a provisional upper reference.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most twelve beam corners, one hull and four support primitives.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each invocation builds its independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction retains no state.

## @evidence contracts/development/common.md#meaningful-documentation

Names the floor and beam frames, the shape and the admitted dimensions.
