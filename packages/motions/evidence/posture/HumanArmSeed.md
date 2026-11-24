# src/posture/HumanArmSeed.ts#HumanArmSeed.held

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, why its failure refuses the whole problem and what it starts from.

## @evidence contracts/development/implementation.md#principled-implementation

Feasibility of the trajectory implies feasibility of its hold waypoint alone, so the necessary condition is tested first, by the same still problem, starts and refusal the sampling seed uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hold's first waypoint, then the seed's own instant solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bound is relaxed and no start is dropped: the solve starts from the caller's seed alone, and the refusal is the seed's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One still problem of three waypoints, feasible from its first start for a course whose hold is fitted on its sites.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `instant` with `seed`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmSeed.ts#HumanArmSeed.seed

## @evidence contracts/development/common.md#meaningful-documentation

States the problem, the context, the hold and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

MoveIt's optimiser adapter (chomp_optimizer_adapter.cpp lines 177-209 at 811328b1ba70, BSD-3-Clause): the sampling planner's path seeds every optimisation and its failure ends the plan. The goal is the hold's configuration by inverse kinematics once from the caller's seed (MoveIt's zero-timeout single attempt, kdl_kinematics_plugin.cpp line 280 at fdb79acafb24, BSD-3-Clause; no attempt count, MIGRATION.md #1288); the reach and the return are the time-indexed RRT-Connect's paths (HumanArmConnect) over OMPL's box bounds of the coordinates, the shoulder chart's disc left to the validity reading; a state's time coordinate is its own time, normalised over the span, and its validity is read in the scene at the frame nearest that time, as EXOTica's TimeIndexedSamplingProblem updates its scene to the state's time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hold, then the two paths, then the waypoints read off them at their own times.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback: a path the planner does not find is a refusal, never the straight line.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two planner queries per seed, each bounded by its iteration condition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the hold's inverse kinematics with `held`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call.
