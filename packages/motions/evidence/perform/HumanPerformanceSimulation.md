# src/perform/HumanPerformanceSimulation.ts#HumanPerformanceSimulation.bake

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Samples the displayed motion at the cache rate, places each impulse at the boundary that opens its step, and leaves the solve to the engine's fixed-step simulation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, sample, place forces, decide releases and groups, plan bodies, add solids, compute; each decision has its own helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The floor box and its depth come from the bodies' own reach; nothing is tuned to a scene.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P * S) displayed-bone reads for P performers over S steps, then the engine's solve, which dominates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each step's displayed bones are read once and shared by the targets, the impulse sites and the grips.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The engine frees its native world before resolving; the reading retains the completed simulation for the performance's lifetime.

# src/perform/HumanPerformanceSimulation.ts#HumanPerformanceSimulation.covers

## @evidence contracts/development/common.md#meaningful-documentation

States the closed window and the performer test.

## @evidence contracts/development/implementation.md#principled-implementation

The window is closed: its end frame is the hand-back's last solved state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership and two comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanPerformanceSimulation.ts#HumanPerformanceSimulation.pose

## @evidence contracts/development/common.md#meaningful-documentation

States the clock change and which bones come from where.

## @evidence contracts/development/implementation.md#principled-implementation

A bone is the solver's exactly while the cache's causal ownership record says the solver owns its segment (dynamic or returning); an authored segment's cached frame is its target, which the kinematic pose already is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ownership, then one cache read only when something is owned, then the reconstruction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window's local second is clamped onto the cache's domain only for the floating rounding of film seconds.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B * E) ownership lookups for B segments over E ownership events, one interpolated cache read when needed and one rig walk.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of the baked cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pose; retains nothing.
