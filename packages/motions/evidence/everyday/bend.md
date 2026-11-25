# src/everyday/bend.ts#bend.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the solve, the timing, the postures and both refusals; the law's doc gives the sources and the provisional constants.

## @evidence contracts/development/implementation.md#principled-implementation

Esola et al.'s lumbopelvic rhythm and the strategy's lowered body carry the arm planner. The palm faces down against a flat target, and the free hand braces on the thigh (Kingma et al. 2016). The two motions share one clock with the measured aimed timing and the named hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chosen lowering writes root, trunk, gaze and legs. Two arm goals and the fingers read the resulting pose, each on its channel. The hold reads the same authored lowest key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A self target's lowerings are the law's candidates, tried in order as Vahrenkamp et al. 2013's Algorithm 1 tries base poses (`AutoMovieMotionHumanTouchStance.choose`): the first whose whole arm course admits; the automatic squat follows the semi-squat as a declared candidate. The reached point stays where authored. The hold and the reaching elbow hint are provisional.

## @evidence contracts/development/implementation.md#efficient-algorithms

The lowering and its pitch are planned once. The planner lays trajectories over the actual descent and ascent and refines failed stretches. Hold duration adds no arm waypoints or posture fits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The strategy, lean, pitch, timing and stand base are computed once per course. Each native squat trial reads its carried wrist from the same displayed bones as its support residuals. Each eligible native arm goal reads the target, shoulder and shins from one pose. Custom readers keep separate observations in their original order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains this body's lowered geometry and arm courses, released with the performance. No query history grows in playback.

# src/everyday/bend.ts#bend.lowering

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, the solve and the declared squat candidate.

## @evidence contracts/development/implementation.md#principled-implementation

The campaign's strategy rule (`choose`); an `auto` semi-squat that cannot reach declares the squat after it, chosen as Vahrenkamp et al. 2013's Algorithm 1 tries the law's declared candidates (`AutoMovieMotionHumanTouchStance.choose`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One choice and at most two solves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only `auto` declares a second candidate, and only after a semi-squat; a refusal of any kind but reach is passed on, and an exhausted choice refuses with both candidates' reasons.

## @evidence contracts/development/implementation.md#efficient-algorithms

One solve, two when `auto` falls back.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by the bend law and by the pick-up's lowering, so both choose and lower alike.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bend.ts#bend.choose

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its mid-shank threshold and that the plan may still replace the semi-squat by a squat.

## @evidence contracts/development/implementation.md#principled-implementation

Compares the target's height with the body's own ankle height plus half its shank, so the threshold scales with the body; no study ranks the techniques (van Dieen et al. 1999), so the threshold is the campaign's rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure decision kept apart from the reach solve, which owns the fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The mid-shank threshold is the documented campaign rule, not a tuned value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/bend.ts#bend.ICandidate

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the candidate fixes: the trunk's alignment, the strategy and the reach in metres.

## @evidence contracts/development/design.md#principled-representation

One lowering of a self-target bend, as the plan builds it: the three inputs `planBendStrategy` takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each passed to the plan; the candidates' order is the law's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A candidate is checked by the whole plan it builds, never by a proxy of it.
