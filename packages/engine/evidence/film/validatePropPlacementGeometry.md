# src/film/validatePropPlacementGeometry.ts#validatePropPlacementGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Every judgment is an axis-aligned world-box predicate on the staged occupancy from `propOccupancyBounds`: strict-interior overlap through `propBoundsOverlap`, corner containment through `propSpaceContainsBounds`, the deepest support probe through `propSupportGap` within a nanometre, and opening fit against the fill's rest-pose part boxes from `builtElementRestMatrices` and `builtPlacedPartBoxes`, the same measurement `propBlockedPassages` takes of an opening.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split from `validatePropPlacements` so the registry and relation gate and the geometry judgment each stay one readable owner; private helpers hold clearances, pairwise overlap, supports and per-environment occupancy, each one claim family.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsound props, unstateable faces and model-less fills are skipped so one fault is reported once; a space subtree stating neither cells nor a shell adds no containment restriction, while shell-only volumes are measured. Declared contact exempts only the overlap between the two props that declare it; no prop, kind or building is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States what "sound" means and why, which props are measured as occupants only, the overlap exemption, how the judged environment is chosen, how an opening is fitted, the filled-passage exemption, and the report order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Occupancy is measured once per sound prop; overlap and clearance add O(S² + S·C) box tests for S sound props and C clearances. Support, containment and opening relations add their delegated environment-list, footprint and part traversals, and each judged environment's passage query is prepared once. No small prop or relation count is enforced here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares each prop's occupancy across its checks and prepares each judged environment's passage bounds once through createPropPassageBlocker, keyed by that environment object during the synchronous validation. Inputs stay unchanged for the call; no closure is reused across later mutable environment revisions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns the sound-prop list and a lazy map of passage queries for at most the judged environments until return; each query retains that environment's measured passage boxes. All temporary lists, maps and queries are released after validation, while violations transfer to the caller's collector.
