# src/architecture/builtEnvironmentPlacementOverlapSweep.ts#builtEnvironmentPlacementOverlapSweep

## @evidence contracts/development/implementation.md#principled-implementation

A sort-and-sweep broad phase on union boxes followed by part-box interval intersections. Summed pairwise intersection volumes can double-count overlapping parts; the reported fraction divides by the smaller summed part-box volume and clamps to one. Ties in x keep declaration order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares body resolution with the single-body and pairwise queries through `resolveBuiltPlacementBody`, fed from `builtEnvironmentPartBoxes`, so this query owns only the sweep, the narrow phase and the grading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no production or body; contact is excluded by the shared box kernel, and the clamp is a stated proxy-volume rule for self-overlapping parts rather than a fixture adjustment.

## @evidence contracts/development/common.md#meaningful-documentation

States the body set and order, the broad and narrow phases, the contact rule, the units of `volume`, how `fraction` is computed and why it is clamped, the pair sort, what `measured`, `compared` and `unresolved` mean, and the `along-route` throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays one batch part-table measurement, each body's union or population placement fold, and O(R²) worst-case population lookup work for R populations. For B resolved bodies, sorting costs O(B log B); active-list scanning and splice shifts cost O(B²) worst case, in addition to admitted part-count products and O(Q log Q) sorting of Q findings. `compared` counts candidate comparisons, not all this work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The part table is built once per call and every body's reported box and solids are read from it, so no element is staged or measured twice; nothing is reused across calls because the record is the caller's and may change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The part table, body list and active list live for one call; the active list holds at most the resolved body count, and the caller owns the returned report, bounded by the admitted pair count.
