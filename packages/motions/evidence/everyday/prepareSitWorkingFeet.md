# src/everyday/prepareSitWorkingFeet.ts#prepareSitWorkingFeet

## @evidence contracts/development/common.md#meaningful-documentation

Explains the world-metre reach interval, the feet that move, and where it applies.

## @evidence contracts/development/implementation.md#principled-implementation

The reaches are two-bone chords intersected with the existing deck, using the ordinary gait curve for the two steps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Intersect the reachable placements, then prepare the two swings and their contact windows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Feet lift off the deck before changing placement; if no one-step fit exists the ordinary reach refusal applies.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work to find the placements, then one current swing and two ankle goals per read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses seated root placement, seated leg reach and the ordinary walk's sourced swing curve and step dimensions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the prepared pair of swings and fixed feet live with the sit plan.
