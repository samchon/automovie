# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.read

## @evidence contracts/development/common.md#meaningful-documentation

States the fit, both ways of solving it and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The flexion and the abduction are the source's own measure (`measured`), the twist room the forearm's twist against its own range, and the tilt the asked rotation's up axis read again through the reached rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve, one bone read and four readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The readings are the resolver's fit within the joints' ranges, never the asked goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keeps the actual arm fit and referred reference fit; canonical selection omits only proven unrelated digit goals and final FK requests upper/lower arm, hand and hip frames. Every direct joint is still admitted, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local exact reader connects the referred reference, actual canonical fit and demanded FK; a parent may lend same-body FK/genuine ROM metadata. Every current raw goal and authored joint receives the resolver's original admission/fitting without a partial-leg reuse assertion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The four-name demand and lazy exact FK preparation end on synchronous return/throw; the scalar result retains no pose, reader or candidate history.

# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.prepareRead

## @evidence contracts/development/common.md#meaningful-documentation

Binds body/side and borrowed rig metadata only until the candidate search returns or throws; each posture/goal/reference/axis still produces an actual numeric reading.

## @evidence contracts/development/implementation.md#principled-implementation

All candidates use one unchanged rig while their goals vary, so native FK/ROM preparation can share without sharing a solved candidate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One genuine FK getter and ROM projector feed the existing read owner; no alternative fit or admission path is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every candidate, referred reference fit, authored projection, IK and physical bound; no time or goal result cache is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across Q observations one O(B+D) rig preparation replaces Q repetitions, while all actual joint projection, fitting and selected FK remain; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed body/side and unchanged rig/canonical mappings establish only metadata equivalence; changed postures/goals still execute read independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous search owns one getter/projector until completion or throw; its callback retains no candidate pose, goal or query history and never enters the returned drinking answer.

# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the asked axis and its two ends, the swing removed, the twist kept and why the blend does not do.

## @evidence contracts/development/implementation.md#principled-implementation

The vessel's attitude is its axis alone, so only the swing of the blend's hand off the asked axis is removed (the shortest arc), its twist about the axis left free; the asked axis meets the held end's at weight 0 and the goal's at weight 1, so the hand is continuous where the carry leaves its ends, and the arm's own goal is the drinking one throughout, so the carry's blend and its clearing course aim at one arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two interpolated axes (the tip from upright, then the way from the held end) and one shortest arc per second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The end's axis is the one the goal's fit shows at the same second, so at the lips the vessel leans exactly as the arm shows it; neither end is moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per written second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the carry's two ends and the engine's `rotationBetween` and `Quaternion.slerp`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function closes over its inputs only.

# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.drinks

## @evidence contracts/development/common.md#meaningful-documentation

States the three conditions and what decides the rest.

## @evidence contracts/development/implementation.md#principled-implementation

The healthy drinkers' range of shoulder flexion and abduction (Alt Murphy et al. 2006), with the forearm kept off its range's end as every laid arm's reference keeps it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conjunction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound is a named constant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the laid arm's own margin.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.nearer

## @evidence contracts/development/common.md#meaningful-documentation

States the comparison, its unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The searches admit an arm that `drinks` with the vessel's axis within their step, each bound on its own, so an arm lies past admission by the greatest excess, every term in degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A tie keeps the earlier arm; the tilt's bound is the searching caller's own, passed in, not a second constant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by both drinking searches.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanDrinkingArm.ts#AutoMovieMotionHumanDrinkingArm.refused

## @evidence contracts/development/common.md#meaningful-documentation

States what the refusal reports.

## @evidence contracts/development/implementation.md#principled-implementation

Reports the range's bounds and the nearest arm's readings in the source's measure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bounds are the named ones.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Thrown by both drinking searches.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
