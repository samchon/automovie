# src/analysis/assertAutoMovieAnalysisSolids.ts#assertAutoMovieAnalysisSolids

## @evidence contracts/development/implementation.md#principled-implementation

Checks id blankness and uniqueness with a `Set`, delegates the plane rule to `validateSolidPlanes` with a fresh collector per solid, and turns that solid's first violation into an `Error`, so the context validator and the daylight request apply one rule in two failure styles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin throwing adapter over the accumulating rule; the plane checks stay in `validateSolidPlanes`, and only the id rules, which a context validator states separately for occluders, live here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reports only the first violation of the first malformed solid because the throw ends the study either way, and no solid id or label is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the shared rule and why it throws, the three throwing faults and what the message names, how `label` is used, and that uniqueness is per list.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in solids N plus their planes P with one `Set` of ids, O(N + ΣP); the per-solid collector keeps each solid's violations separate so the first one names the right solid.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates one caller list once per study; no verdict is cached because each study passes its own shades.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id set holds at most N ids and each collector lives for one solid's iteration; all are released when the call returns or throws, and nothing is retained.
