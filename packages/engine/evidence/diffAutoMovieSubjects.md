# src/diffAutoMovieSubjects.ts#diffAutoMovieSubjects

## @evidence contracts/development/implementation.md#principled-implementation

Matches stable subject addresses and compares placement and shape projections with tolerance-aware equality, including quaternion sign equivalence. Slot selections use the runtime weighted draw and JSON tuples of selection status, prototype and model, so delimiters inside ids cannot merge distinct identities; absent explicit prototypes are detected by table membership.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The diff owns classification and fan-out only; descriptions come from `describeAutoMovieSubjects`, addresses from `autoMovieSubjectAddress`, paging from `autoMovieSubjectMemberSummary`, and the prototype table rule from `instancePrototypeChoices`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject or model is special-cased; a missing explicit prototype is keyed as missing by an explicit membership test instead of by matching the text of the selection's error, and environment-owned models are compared like compiled ones.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the exclusivity rules, what placement and shape mean per kind, how each fan-out count is formed and from which revision, the tolerance and its rotation metric, the matching and ordering, the unchanged summary, and the failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Inventory construction delegates geometry, placement and material measurement to describeAutoMovieSubjects, then O(S log S) orders subject ids and structural equality visits compared values. Each queried model's parts are indexed once, avoiding quadratic part lookup. Lazy usage costs O(sum of slot count times prototype count), since each weighted or explicit slot selection scans its table; common-slot changes do the same. Each returned member summary also copies and sorts its supplied ids, including repeated fanout summaries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call each revision's inventory and record indexes are built once; part indexes are built only for models whose part shapes are compared, and usage only for prototype or part fanout. First duplicate parts preserve the previous find rule, and no mutable artifact cache survives across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inventories, requested part indexes and usage tables are call-local, bounded by artifact subjects, queried parts, models and sets. The returned diff holds changed descriptions and one bounded unchanged sample; descriptions may borrow nested artifact records.
