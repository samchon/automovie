# src/validation/IAutoMovieAppendShotMetadataArtifact.ts#IAutoMovieAppendShotMetadataArtifact

## @evidence contracts/development/common.md#meaningful-documentation

Structurally narrowed shot fields inspected at stored and submitted artifact boundaries. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Optional unknown metadata fields intentionally represent untrusted ingress rather than admitted shot values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stored and submitted shot gates share metadata inspection with separately supplied reporting/camera context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Structural evidence cannot independently prove geometry freshness and absent metadata is not invented.

# src/validation/IAutoMovieAppendShotMetadataArtifact.ts#IAutoMovieAppendShotMetadataArtifact.IShot

## @evidence contracts/development/common.md#meaningful-documentation

Defines optional dispatch, borrowed values, append effects, duration fallback and failure propagation.

## @evidence contracts/development/design.md#principled-representation

Optional unknown fields support both narrowed untrusted records and typed stored shots without pretending metadata is already admitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Submitted-shot and stored-slice validators share metadata checks while separately supplying the path, nullable camera-id context and violations sink.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absence preserves legacy metadata omission; structural clearance admission cannot prove freshness against geometry revisions that this projection does not carry.
