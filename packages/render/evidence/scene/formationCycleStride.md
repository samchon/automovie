# src/scene/formationCycleStride.ts#formationCycleStride

## @evidence contracts/development/implementation.md#principled-implementation

Selects the first track with the lowest finite sampled height, measures its closed XZ path and divides half that path by lower-half-height occupancy; admitted finite periodic tracks are premises, with empty/horizontally still output zero and the lowest-part/contact/reciprocal-sweep model only a gait heuristic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps the bake-derived stride estimate beside its trajectory input rather than embedding gait-name stride constants or duplicating the engine's contact/constraint solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses measured positions and one explicitly disclosed height proxy uniformly across parts; no foot/hoof asset names, desired ground distances or hidden tolerances adjust the estimate.

## @evidence contracts/development/common.md#meaningful-documentation

States metre output, lowest-track selection, half-path/contact-fraction computation, zero cases and arbitrary-path/contact limitations instead of presenting a heuristic as exact physical identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans all P tracks' S samples for lowest height and the chosen track for path/height fraction, O(P*S) dominant time and O(S) temporary heights; variadic min/max restrict extremely large custom sample counts, while current bake callers use the fixed modest sample population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Derives both path and contact proxy from the same selected baked track, reusing already sampled geometry without another pose solve; mutable trajectory input has no persistent cached equivalence key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows trajectory vectors and returns one scalar, retaining no tracks or native handles; temporary height arrays are released after the call and no worker/render task is acquired.
