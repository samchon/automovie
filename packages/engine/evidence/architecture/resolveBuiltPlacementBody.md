# src/architecture/resolveBuiltPlacementBody.ts#resolveBuiltPlacementBody

## @evidence contracts/development/implementation.md#principled-implementation

Unions the supplied axis-aligned part boxes under their static CPU measurement premise. Equal minimum and maximum coordinates select the point basis, whether produced by the origin fallback or degenerate geometry; the label alone does not distinguish those sources.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolution rule behind the single-body bounds query and both overlap queries, with the part source injected because one caller measures one element and another reads a building-wide table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element, population or caller; an unresolved locator answers null for the caller to report, and the `along-route` refusal of the population fold passes through rather than being caught.

## @evidence contracts/development/common.md#meaningful-documentation

States what `parts` supplies and what its empty answers mean, how the element box and its basis are derived, that populations stay compact, the `along-route` throw, and every null case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One caller-supplied part lookup plus an O(P) union of P part boxes, or an O(R) scan of R populations plus the placement-bounds fold. The fold validates every stored explicit transform and constructs eight corners per selected explicit member; compact layouts use a bounded corner set.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The part boxes the caller supplies are reused as the solids and as the input to the union, so each body is measured once per resolution; reuse across bodies is the caller's lookup, such as the sweep's one building-wide part table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the result references the lookup's part boxes and one new union box, both owned by the caller.
