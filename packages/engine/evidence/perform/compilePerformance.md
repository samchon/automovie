# src/perform/compilePerformance.ts#compilePerformance

## @evidence contracts/development/implementation.md#principled-implementation

Fans unison actors, assigns stable start/action-order lanes, masks actual channels, then samples the union of keyframe and envelope-boundary times; epsilon boundary pins prevent long backward interpolation leaks while persistent roots outlive joint/expression envelopes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The compiler owns assembly and loss reporting; synthesis owns rig-specific content, arrangeMotion owns gaps, and blendPoses owns per-axis composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-6 second boundary pin and 1e-9 envelope comparisons are existing temporal tolerances; loss is reported rather than hidden, and arbitrary actor keys are stored as own data properties.

## @evidence contracts/development/common.md#meaningful-documentation

States admitted inputs, null handling, repeat behavior, regional lanes, persistent roots, exact actor keys and mask ordering; sampling remains approximate between union instants.

## @evidence contracts/development/implementation.md#efficient-algorithms

For A action/actor expansions, K repeated keyframes, P placements and U union times over L lanes, assembly copies O(K), lane sorting costs O(P log P) plus O(P L) lane search, and layering visits every lane per union time plus its motion sampling and joint blend cost; output/storage grow with authored repeats and samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One synthesized base is reused for repeats, one mask pass also records loss, and union times are deduplicated before sampling; callbacks are not cached across distinct actions because their content may depend on action/actor state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns performances and reports; lane maps, grids and accumulators are released after return/throw, borrowed nested motion content follows helper contracts, and no retained host/task exists.
