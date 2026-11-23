# src/architecture/IAutoMovieDesignImpact.ts#IAutoMovieDesignImpact

## @evidence contracts/development/design.md#principled-representation `designLineageImpact` walks the declared input edges backwards breadth-first from the changed ids, so an artifact is invalidated exactly when it is reachable from a changed identity; the premise is that `inputs` lists every dependency, which validation cannot prove.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three sorted id lists, the question, its reach, and the complement, so a caller checks `invalidated` and `unaffected` partition the derived artifacts without a second query.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unknown changed id throws instead of being dropped, and an invalid lineage throws before the walk, so a typo cannot produce an empty and falsely clean impact.

## @evidence contracts/development/common.md#meaningful-documentation

States why the complement is reported, the code-unit ordering, deduplication of `changed`, that a changed artifact is itself invalidated, and the error on an unknown id.
