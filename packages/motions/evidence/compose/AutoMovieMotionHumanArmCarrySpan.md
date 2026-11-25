# src/compose/AutoMovieMotionHumanArmCarrySpan.ts#AutoMovieMotionHumanArmCarrySpan

## @evidence contracts/development/common.md#meaningful-documentation

States the group's span and its knots.

## @evidence contracts/development/implementation.md#principled-implementation

One problem spans every member's own span: earliest start and reach, latest release and end, each member's knots its waypoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One knot union and, where the spans differ, four extrema.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every member's knots are kept; equal spans return the member's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the members and their knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the members' own spans.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns fresh records.
