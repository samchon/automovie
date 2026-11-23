# src/architecture/builtOpeningSweepEnvelope.ts#builtOpeningSweepEnvelope

## @evidence contracts/development/implementation.md#principled-implementation

A revolute corner's world coordinate is `c + b cos t + d sin t`, whose extremes over `[min, max]` are the endpoints plus every `phase + kπ` inside the range, so the box is solved rather than sampled; a prismatic corner is linear in its travel and extreme at its limits. Finite ordered travel must contain rest at zero, and revolute travel spans at most one turn, so its absolute limits and critical indices stay bounded and integer increments progress; this function refuses violations of those shared admission rules before enumeration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Staging comes from `builtEnvironmentWorldMatrices` and the opening lookup from `requireBuiltOpening`; the panel's base frame is its parent's staged matrix times its rest transform, which removes only its own travel without restaging the building per panel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no opening or panel; the full-turn cap is the shared contract constant rather than a private copy, and an unenumerable travel is refused instead of truncated.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact solve, that ancestors stand at the current state and only the panel's own travel is swept, why no chain union is formed, the box's corners and order, and every refusal with the cap it uses.

## @evidence contracts/development/implementation.md#efficient-algorithms

One opening lookup, element index and shared staging precede constant work per queried panel corner, with a bounded critical-angle population. Shared staging costs O(E + O + S + M + V) for elements, operating members, scanned states, movable panels/carriages and selected state values, using call-local value indexes; matrices, indexes and returned sweeps grow with those populations and queried panels.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one opening per call from the caller's mutable record; within the call one staging and one element index serve every panel.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the staged matrices and element index only for the call and returns new sweep records; nothing is retained.
