# src/actions/walkSwing.ts#walkSwing

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint ownership, fixed body/gait inputs, the action timebase, the plan's swings and the endpoint reads made for each as the plan is made.

## @evidence contracts/development/implementation.md#principled-implementation

A swing leaves the stance with its ankle, pitch and toe rates read over one millisecond and joins the stance at heel strike; `walkFoot.prepareSwing` owns its interpolation and clearance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Every swing of the plan is prepared as the plan is made: its departure, the two stance readings before it, its arrival and the other foot's stance at mid-swing are read, then the shared swing owner is prepared once for them; the lookup hands back the prepared reader and refuses a swing the plan does not schedule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every endpoint, rate interval, lift, straight-leg and landing rule is read from its owner; nothing is replayed from another swing.

## @evidence contracts/development/implementation.md#efficient-algorithms

A preparation costs three endpoint reads and the swing's fixed decompositions; each share read then costs only the interpolation and clearance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A swing's reader is looked up by its side, toe-off and heel strike; nothing is prepared on a read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns one reader per scheduled swing. Each retains fixed swing terms, with no FK loan or arbitrary-time history.
