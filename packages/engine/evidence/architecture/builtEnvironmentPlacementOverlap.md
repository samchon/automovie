# src/architecture/builtEnvironmentPlacementOverlap.ts#builtEnvironmentPlacementOverlap

## @evidence contracts/development/implementation.md#principled-implementation

Resolves each side once and applies `propBoundsOverlap` to proxy pairs. Its strict endpoint inequalities exclude exterior contact but can admit internal degenerate planes/points; this pair query does not promise the positive shared-volume policy applied by the sweep's separate volume fold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares body resolution and the part-versus-union rule with the bounds query and the sweep, so this query owns only the pair verdict and the unresolved listing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no body or production; an unresolved side is reported as such rather than defaulted to `separate`, and face contact is excluded by the shared kernel rather than by a tolerance chosen here.

## @evidence contracts/development/common.md#meaningful-documentation

States the contact rule, that populations stay compact, why the basis is returned, that elements are tested by part, and the unresolved status, its side order and its null basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each side pays its selected body-resolution cost: element/model scans, full world staging and tessellation for an element, or a population scan and placement fold for a population. The final box test costs O(P₁P₂) for the two part counts, with an early exit on the first overlap.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each side's part boxes are measured once and serve both as its reported box and as its solids, where the earlier form measured every element side twice; nothing is cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing after returning; the caller owns the small result record.
