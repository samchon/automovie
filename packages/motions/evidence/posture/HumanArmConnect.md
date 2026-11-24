# src/posture/HumanArmConnect.ts#HumanArmConnect.IQuery

## @evidence contracts/development/common.md#meaningful-documentation

start and goal: the configurations, the time coordinate last. low and high: each joint coordinate's bounds. valid: whether a configuration is valid at its time.

## @evidence contracts/development/design.md#principled-representation

The state space EXOTica's time-indexed solver builds (a RealVectorStateSpace with its bounds and a TimeStateSpace bounded by the start and goal times) and its validity checker.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmSeed.ts (seed, path).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bounds and the validity are the caller's; the planner reads them only.

# src/posture/HumanArmConnect.ts#HumanArmConnect.connect

## @evidence contracts/development/common.md#meaningful-documentation

States the query, the path and when it is null.

## @evidence contracts/development/implementation.md#principled-implementation

A port of EXOTica's `OMPLTimeIndexedRRTConnect::solve` and `growTree` with `correctTime` and the time-ordered distances (time_indexed_rrt_connect.cpp and .h at cb0124423e7e, BSD-3-Clause), itself OMPL's RRTConnect (RRTConnect.cpp at 340bd214, BSD-3-Clause; Kuffner and LaValle 2000): the trees swap each iteration, one grown toward a uniform sample within the space's own bounds (a disc's pair uniformly within the disc, r = R sqrt(u), theta = 2 pi v), the other connected toward the added state; the joined path drops the duplicate state. OMPL's compound space: distance the sum of the joints' Euclidean in radians and the time's in seconds, EXOTica's metric; the step EXOTica's default Range 1 (init/time_indexed_rrt_connect.in at cb0124423e7e), set before setup (time_indexed_rrt_connect.cpp line 127) so OMPL's automatic range keeps it; DiscreteMotionValidator::checkMotion at 0.01 of each component's extent; OMPL's IterationTerminationCondition(1000) asked as the planner asks it; OMPL's generators, the simplifier's, the repair's and the sampler's, each seeded with its own local seed from OMPL's seed generator (HumanRandomSeeds) in the order a MoveIt request creates them; EXOTica's smoothing; MoveIt's FixStartStateCollision repair (fix_start_state_collision.cpp lines 125-149 at f6a684f979de, BSD-3-Clause). The arm declares no joint velocity limit, so correctTime's least time step is none and only the time's order and bounds bind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The planner, the compound space, the tree growth, the branch reading and the repair are separate private functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback: a planner that does not join the trees, an invalid goal or an unrepaired start returns null, which the seed refuses. The cache Maps of the former planner and its goal-first sample are gone: neither is in the sources.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 1000 condition asks, each iteration one nearest scan of the tree and one motion check of at most the segment count's states.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No state's validity is kept: OMPL keeps none.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The trees live for the call; the returned path is the caller's.

# src/posture/HumanArmConnect.ts#HumanArmConnect.lerp

## @evidence contracts/development/common.md#meaningful-documentation

States the two configurations, the share and the result.

## @evidence contracts/development/implementation.md#principled-implementation

`StateSpace::interpolate`, component by component: a + (b - a) · u, as RealVectorStateSpace and TimeStateSpace interpolate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(dimensions).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array.

# src/posture/HumanArmConnect.ts#HumanArmConnect.generator

## @evidence contracts/development/common.md#meaningful-documentation

States the seed and the generator.

## @evidence contracts/development/implementation.md#principled-implementation

mulberry32, kept for its caller outside the planner (floor/sleep.ts); the planner draws from HumanMersenneTwister.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A closure over one word.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unchanged; not used by the planner.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1) per draw.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One word per generator.
