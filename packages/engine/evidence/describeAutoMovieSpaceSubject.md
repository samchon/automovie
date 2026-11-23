# src/describeAutoMovieSpaceSubject.ts#describeAutoMovieSpaceSubject

## @evidence contracts/development/implementation.md#principled-implementation

The declared box is the bounds of the stated volume's vertices, exact for a shell and for a bounded convex cell whose corners `builtConvexCellVertices` solves from plane triples, and the content box is delegated to the engine's content query so description and framing agree on where a room's content stands.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for a space subject, read by the subject describer for both single and inventory description, and it reuses the shared cell-corner solver instead of the private plane intersection the describers each kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space kind is special-cased; a space that states no volume reports a null declared box rather than a guessed one.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the owner, the empty fields, the member classes and paging, and the meaning, source and units of both boxes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the environment's spaces, elements and populations for the members, O(p³) per cell of p planes for the corner solve, and one staging of the environment inside the content query, which that query performs per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Describes one space per call; the describer calls it once per space, and the content query restages the environment each time because it takes no precomputed staging.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new description the caller owns; the member list and cell corners are released on return.
