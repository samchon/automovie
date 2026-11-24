# src/actions/walkLocomote.ts#walkLocomote

## @evidence contracts/development/common.md#meaningful-documentation

States the shared gait plan, author context and caller-owned pace; the namespace gives trajectories, contacts and timing sources.

## @evidence contracts/development/implementation.md#principled-implementation

Planned footprints, a pelvis lowered by its fixed-point reach, constrained swings and a hip-pivoted trunk; explicit channel demand computes only the consumed leg goals and arms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Step planning, per-swing preparation, pelvis settling and posture assembly each have one owner before the clock warp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every footprint, event, authored parameter and solver bound comes from its owner, the gait's numbers named and sourced or provisional; omitted demand evaluates the complete posture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Step lookup is logarithmic in footfalls; each query does bounded pelvis/foot work for its demanded channels. A swing's endpoints, its descent or flight claims, its departure excess and its scheduled and reached swing readers are prepared once per swing as the walk is planned (`walkLocomoteSwings`, `walkLocomoteGround`, `walkLocomoteSolve`), and the arms' carriage once for the plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A swing's endpoints are fixed by its foot and toe-off, so its settled endpoints, its descent or flight and its two prepared swing readers are prepared per swing, keyed by foot and toe-off; root-only pacing omits unread swing goals, and queries share only FK workspaces, which change no result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds body/steps, the carriage, and per swing three settled endpoints, one descent or flight and two prepared swing readers, so its retention grows linearly with its footfalls and is released with the plan; it keeps no arbitrary-time pose cache.
