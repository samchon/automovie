# src/everyday/prepareSitLowering.ts#prepareSitLowering

## @evidence contracts/development/common.md#meaningful-documentation

States the socket course, the trunk's windows, the frames and units, and the borrowed FK source.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk socket and pitch windows, additive back joints on the settle share, `HumanTrunk.incline` under the pelvis limit over the planted feet, and the seated socket-to-root transform before planted-leg lowering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The windows, socket delta and back-joint entries are prepared once; each reading builds the socket and joints, inclines the trunk, places the root and lowers it over the legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The timing is the sit law's named shares; the back settles only once the seat bears, so the weight stays over the feet until then.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares O(J) back-joint entries once; each reading applies J additions, two seated root transforms, one pelvis limit and one lowering.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, timing, endpoints, feet and joint values are fixed for the plan and shared by every reading; each reading's time, back share and leg goals are evaluated afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the O(J) entries, the geometry and its leg writer until release; a borrowed FK source ends with its reading.
