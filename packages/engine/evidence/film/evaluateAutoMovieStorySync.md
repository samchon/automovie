# src/film/evaluateAutoMovieStorySync.ts#evaluateAutoMovieStorySync

## @evidence contracts/development/implementation.md#principled-implementation

Maps every realized time through its shot's pin, then takes the range of the story times in one pass, since the largest pairwise gap of a set of reals is its maximum minus its minimum; unresolved operands fail before any comparison so a missing measurement can never pass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the measurement and verdict only; the story map is `autoMovieStoryTime` and the lookups of pins and realized times are callbacks, so `storySyncDiagnostics` binds them to the production's contracts and realizations without this function knowing their stores.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no shot or event; the tolerance is the caller's, unresolved operands fail rather than being skipped, and the tie rule only selects which events the summary quotes.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping, the inclusive comparison, the independence from the edit, every refusal case and its summary, the empty-list result, the tie rule, and the order of the reported points.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local traversal is linear in addressed events with one callback pair per event and one extreme pass. Supplied callback work is additional and unbounded here; subtracting extreme finite story times can still yield an infinite spread, which fails a finite tolerance.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Evaluates one claim from its callbacks; `storySyncDiagnostics` routes every consumer through one call per claim and owns any reuse of realizations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the outcome and its one point per addressed event.
