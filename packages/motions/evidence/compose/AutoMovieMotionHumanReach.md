# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.measure

## @evidence contracts/development/common.md#meaningful-documentation

States each input's frame and unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The distance from the ball's centre compared with its radius; the shortfall is their positive difference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance and one subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance is added to the length: a point exactly at full length is within reach and one beyond it is not.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.clamp

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and both outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

The nearest reachable point to an outside point is its radial projection on the sphere, so the limb still points at the goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition and one scaling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A point within reach is returned unchanged, never pushed out to the sphere.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.refuse

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what the error carries.

## @evidence contracts/development/implementation.md#principled-implementation

An unreachable contact cannot be performed, so the plan stops with the numbers an author needs to move the target or the performer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One condition and one message.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Throws instead of returning a flag a caller could ignore.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.check

## @evidence contracts/development/common.md#meaningful-documentation

States what of the posture is read, which joint the end is and the frame of the point.

## @evidence contracts/development/implementation.md#principled-implementation

The shoulder is read from the trunk's forward kinematics and the hip from the root and the pelvis joint, the places the limb fits start from; the length is the body's own two segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One root lookup by limb kind, then `measure`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig without the shoulder bone throws instead of measuring from the origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admits all original raw authored joints but emits only the actual arm shoulder and its ancestry, or the original two-hip observation for a leg; no limb fit runs. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares checkOn with prepareCheck, HumanTrunk/hipJoints retain raw FK ownership, and an optional current-person reader shares only exact prerequisites rather than a root or reach answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or reader; the optional borrowed workspace is used only through the actual current root observation and fresh check output.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.prepareCheck

## @evidence contracts/development/common.md#meaningful-documentation

Fixes body/limb metadata; each query takes actual authored posture, world-metre end point and optional synchronous same-person FK source, returning the original reach check.

## @evidence contracts/development/implementation.md#principled-implementation

The genuine HumanTrunk.prepareResolve binds the actual arm shoulder name once; every query still constructs and admits the current raw posture and uses checkOn's original root/length/distance equations. Legs retain hipJoints and its authored pelvis-only policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy fixed arm-demand reader feeds the same root observation and measure owner as cold check, without a separate solver or limb representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No posture, root point, reach result or limb fit is stored; all original authored admission, missing-root error, body lengths and exact reach boundary remain, without adding ROM projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Q arm probes bind shoulder name/indices once and emit only its ancestor closure; current authored-joint admission and actual FK remain per query. No measured speedup is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body and fixed limb prove static name-demand equivalence. A query's explicit FK source is borrowed only at that query, so plan-owned static demand never retains an operation workspace or dynamic answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The operation or plan owns one body/name metadata reader until release; current posture, point and optional reader do not enter it, and every output check is fresh without time/pose history or handles.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and resolution of the result and when it throws.

## @evidence contracts/development/implementation.md#principled-implementation

The shortfall is zero at the limit and positive at none, so bisection on the pitch finds the boundary; it keeps the reachable end, so the returned pitch always reaches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two end checks and one bisection loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lean that does not reach at the limit refuses with the shortfall there; the hips are not moved back here, since balance belongs to the lean primitive a law writes the pitch with.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains the original endpoint checks and bounded bisection to a hundredth of a degree; one fixed shoulder demand and exact FK getter serve every actual tipped-pose probe instead of full bone output and repeated name preparation. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original Lean.tip and prepareCheck's native raw shoulder/measure owner; one synchronous reader shares only exactly unchanged prerequisites across the actual current roots/joints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This call releases its fixed name reader and lazy operation workspace on return or throw; only a numeric pitch escapes, without poses, target results or history.

# src/compose/AutoMovieMotionHumanReach.ts#AutoMovieMotionHumanReach.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, what each policy may change and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each policy is its definition: `refuse` throws, `clamp` projects the point on the reach sphere, `lean` tips the posture by the smallest pitch that reaches.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check, then one branch per policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg that cannot lean refuses instead of falling back to a clamp the law did not ask for.

## @evidence contracts/development/implementation.md#efficient-algorithms

One check when within reach; the lean's bisection only when it is needed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `check`, `refuse`, `clamp` and `lean`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
