# src/actions/walkSwing.ts#walkSwing

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint ownership, fixed body/gait inputs, action timebase, the preparing observation's FK loan and the three endpoint reads.

## @evidence contracts/development/implementation.md#principled-implementation

A swing leaves the stance with its ankle, pitch and toe rates read over one millisecond and joins the stance at heel strike; `walkFoot.prepareSwing` owns its interpolation and clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each preparation reads departure, its millisecond predecessor and arrival, then prepares the shared swing owner once for them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every endpoint, rate interval, lift, straight-leg and landing rule is read from its owner; nothing is replayed from another swing.

## @evidence contracts/development/implementation.md#efficient-algorithms

A preparation costs three endpoint reads and the swing's fixed decompositions; each share read then costs only the interpolation and clearance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuse the reader only for the same side, toe-off and heel strike; the FK loan changes no endpoint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns one reader per requested foot and toe-off. Each retains fixed swing terms, with no FK loan or arbitrary-time history.
