# src/describeAutoMovieSubject.ts#describeAutoMovieSubject

## @evidence contracts/development/implementation.md#principled-implementation

Validates the paging offset as a safe non-negative integer, the only meaningful rank, then resolves the address through `AutoMovieSubjectDescriber`, which describes every kind from the artifact's own records and the engine's own measurements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin public entry point that owns only the offset contract; every description rule lives in the describer shared with `describeAutoMovieSubjects`, so a subject reads the same addressed alone or listed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No address or subject is special-cased, and a fractional or negative offset is refused rather than rounded into a page that does not exist.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every address form, the coordinate space of each kind's bounds, the member page, and every failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the describer's indexes once, linear in the artifact's models, elements and populations, then scans subject kinds until the address matches and measures only that subject.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One address per call over a fresh describer, because the artifact is the caller's value and may change between calls; a caller describing many subjects lists the inventory instead.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The describer and its caches live only for this call and are released on return; the caller owns the returned description.
