# src/posture/HumanArmRefine.ts#HumanArmRefine.unbounded

## @evidence contracts/development/common.md#meaningful-documentation

States what an interval must bound and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The site's interpolant is read against the site itself at every grid instant inside the interval, the check-and-refine loop of a continuous check on the one quantity the waypoints sample from the act.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over intervals; per interval the site reading. A lazy arm-local workspace reuses only the held-site arrays, refreshing their original scalar inputs before each interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every arm and every instant of the frame grid inside an interval is read; an interval below two frames is left as it is, never forced.

## @evidence contracts/development/implementation.md#efficient-algorithms

One Hermite read of three numbers per arm and inner grid instant; no arm is placed. Held-site index, time and point arrays are reused across intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only private array storage is shared across held intervals; every site's presence, time and current point components are read again in their original order, so no target or interpolation result is replayed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Lazily holds one workspace per actually read arm, each bounded by that call's largest hold, and releases all workspaces on return or throw. Only interval indices escape.

# src/posture/HumanArmRefine.ts#HumanArmRefine.split

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the indices, which intervals are split, where, and what is left.

## @evidence contracts/development/implementation.md#principled-implementation

The dyadic refinement of a continuous check on the grid the check itself reads, so the refinement ends exactly on that grid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered traversal appends each waypoint and its interval's optional middle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No instant off the grid is made and no interval is forced below one grid cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N S) for N waypoints and S intervals by the membership lookup; output O(N + S).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two lists.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh array and retains nothing.

# src/posture/HumanArmRefine.ts#HumanArmRefine.hermite

## @evidence contracts/development/common.md#meaningful-documentation

Defines the ordered time/coordinate pairing, endpoint behavior, the waypoints' velocities and accelerations, the C² quintic segments and fresh numeric result.

## @evidence contracts/development/implementation.md#principled-implementation

Flash and Hogan's minimum-jerk path through the waypoints (`HumanMinimumJerkSpline`, Flash and Hogan 1985): a quintic per interval, continuous through its snap at each interior waypoint, at rest in velocity and acceleration at the first and the last.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The prepared reader of the same waypoints, read once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps interval ties, endpoint copies and each actual coordinate calculation; no resampling, angle rounding or interpolation cache is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Solves the waypoints' derivatives in O(N D), then bisects N knot seconds for one O(D) quintic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All callers use this same interpolant; a caller reading many instants prepares it once (`prepareHermite`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh coordinates, with call-local tangent arrays and no retained input or result history.

# src/posture/HumanArmRefine.ts#HumanArmRefine.prepareHermite

## @evidence contracts/development/common.md#meaningful-documentation

States time units, fixed inputs, held endpoints and fresh coordinate/index ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Solves each waypoint's velocity and acceleration on the minimum-jerk path once (`HumanMinimumJerkSpline.derivatives`). The quintic and the interval search are shared with the one-shot interpolant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index lookup reports the interval and the shoulder chart's preceding knot. The solved derivatives serve both actual admission and display reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every queried second is evaluated with the same arithmetic and ties. No samples, poses, physical checks or precision are substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(ND) preparation for N knots and D coordinates, followed by O(log N + D) sampling without tangent arrays or span divisions per coordinate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only times, spans and coordinate differences of the unchanged authored knots are shared. Every sample still evaluates its actual time polynomial.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader borrows the fixed knot arrays and owns O(ND) coefficients for its lifetime. No query history, pose, workspace or handle is retained.
