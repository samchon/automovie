# src/draw/index.ts#replaceAutoMovieDrawInspection

## @evidence contracts/development/common.md#meaningful-documentation

States restoration-before-placement, current-object admission, optional renderer and kind declarations, and failure cleanup.

## @evidence contracts/development/implementation.md#principled-implementation

An inspection owns masks, materials and measurements of concrete objects. A seek may replace those objects, so request equality cannot certify reuse: release the prior state, await placement and apply to the resulting graph.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Restore the previous owner, await one placement and call the single inspection producer with the resulting current marks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stale handle, subject monkeypatch, fake readiness or renderer replacement bypasses scene placement. A placement failure cannot leave the old scene inspection active.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds one restore and one actual inspection application around the owner's placement cost. Mesh/triangle measurement remains the inspection owner's work; no assumption of unchanged topology skips necessary admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the existing inspection producer and its cleanup rather than duplicating masks, shade or geometry measurements; source graph identity is not inferred from an unchanged request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The previous inspection ends before asynchronous placement. The returned handle alone owns current inspection resources; applyAutoMovieInspection rolls back its own failed application and no query cache or background task is retained.
