# src/posture/HumanArmPathSimplify.ts#HumanArmPathSimplify.ISpace

## @evidence contracts/development/common.md#meaningful-documentation

distance: the metric. interpolate: the state a share of the way. checkMotion: whether the straight motion is valid.

## @evidence contracts/development/design.md#principled-representation

The three space operations OMPL's PathSimplifier asks of its SpaceInformation (`distance`, `getStateSpace()->interpolate`, `checkMotion`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmConnect.ts (spaceOf); posture/HumanArmPathSimplify.ts (smooth).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The space's metric and validity stay with its producer.

# src/posture/HumanArmPathSimplify.ts#HumanArmPathSimplify.ITermination

## @evidence contracts/development/common.md#meaningful-documentation

calls: how many times the condition was asked, OMPL's `timesCalled_`. max: how many asks it answers no to, `maxCalls_`.

## @evidence contracts/development/design.md#principled-representation

Exactly OMPL's IterationTerminationCondition state (src/ompl/base/terminationconditions/src/IterationTerminationCondition.cpp at 340bd214, BSD-3-Clause).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmConnect.ts (connect); posture/HumanArmPathSimplify.ts (fired, smooth).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The count is the only state; nothing else decides termination.

# src/posture/HumanArmPathSimplify.ts#HumanArmPathSimplify.fired

## @evidence contracts/development/common.md#meaningful-documentation

States the condition and whether the planner must stop.

## @evidence contracts/development/implementation.md#principled-implementation

OMPL's `IterationTerminationCondition::eval`: ++timesCalled_ > maxCalls_.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One increment and a comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Advances the caller's count only.

# src/posture/HumanArmPathSimplify.ts#HumanArmPathSimplify.smooth

## @evidence contracts/development/common.md#meaningful-documentation

States the path shortened in place, the space, the generator and the condition.

## @evidence contracts/development/implementation.md#principled-implementation

EXOTica's `TimeIndexedRRTConnectSolver::GetPath` smoothing (ipab-slmc/exotica exotations/solvers/exotica_time_indexed_rrt_connect_solver/src/time_indexed_rrt_connect.cpp at cb0124423e7e22c0018a6ff8d5bfb0b5feee7f97, BSD-3-Clause, Copyright (c) 2018, University of Edinburgh): reduceVertices, collapseCloseVertices, reduceVertices at most ten more times while it shortens, then the shortcut while it shortens, the ten passes counted together, each step only while the condition has not fired; each pass a port of OMPL's PathSimplifier.cpp at 340bd214 (BSD-3-Clause, Copyright (c) 2008, Willow Garage): `reduceVertices` (lines 124-185), `collapseCloseVertices` (lines 711-770) and `partialShortcutPath` (lines 293-491, the function EXOTica calls shortcutPath) at their defaults (rangeRatio 0.33, snapToVertex 0.005, steps the state count), the path's cost its length as OMPL's default objective.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sequence, then one private function per OMPL pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The passes' parameters are OMPL's defaults; the ten passes are EXOTica's; no tolerance is ours.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each pass at most the state count of draws, each one motion check; collapseCloseVertices is quadratic in the states for its pair table, as OMPL's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass reads the path as it stands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates the caller's path; the pair table lives for one pass.
