# src/kinematics/hingedSwivelAhead.ts#hingedSwivelAhead

## @evidence contracts/development/implementation.md#principled-implementation

Lexicographic legality precedes deviation, with the existing positive-only 1e-9 degree tie and caller tie/second policy. A tie width quantises the deviation into buckets (task priority's "among the first objective's optima", Siciliano and Slotine 1991, made a transitive relation). A bound cannot exceed its exact score nor its bucket the exact one's; when a's exact bucket is already below b's bound's, b cannot win and needs no exact query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparator owns the same policy for sweep and golden refinement; exact and second are the single owners of lazy per-candidate reads, including final returned values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves exact-zero legality, all original strict comparisons without a width and earlier-candidate ties. The buckets use the caller's own width; no new cost, threshold, candidate or approximate certificate is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each comparison performs constant scalar work plus only the deferred objective reads its bounds cannot decide. Each candidate's exact and second callback runs at most once; no search or candidate sampling is changed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A completed pure exact or second reading belongs to this immutable candidate under the unchanged synchronous score/target. It is shared by comparisons and final result reporting; no reading crosses candidates or solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

This helper owns no collection or handle. Two optional scalar readings remain on caller-owned bounded candidate records until their search releases them, including on throw.

## @evidence contracts/development/common.md#meaningful-documentation

States exact zero legality, positive overshoot rounding, bound premise, strict ties and the same-record lifetime of exact/second readers.
