# src/production/IAutoMovieExternalMotionTake.ts#IAutoMovieExternalMotionTake

## @evidence contracts/development/design.md#principled-representation

This metadata retains the glTF inspector convention clip_<animationIndex>, null absent/empty names and maximum final sampler time rather than last-minus-first span. The production inventory comparison is retired; hosts must copy current inspection facts faithfully, and source animation reordering changes positional take identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity, source index, optional name and duration describe the inventory entry without embedding channels or selecting an adoption target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Duplicate or missing display names do not select another take, and adoption cannot choose an animation absent from the source-index inventory.

## @evidence contracts/development/common.md#meaningful-documentation

Gives asset-scoped stable id, zero-based animation index, null unnamed semantics and inspected duration in seconds.
