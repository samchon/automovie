# src/render/caption/IAutoMovieBeatCaption.ts#IAutoMovieBeatCaption

## @evidence contracts/development/design.md#principled-representation

The record carries the beat node's caption verbatim and the slug `screenplaySceneSlug` formats, so a span's scene label and the screenplay heading come from one formatter, and null mirrors the absence the tree payload itself encodes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two nullable fields are all the sidecar join reads from a beat node; the beat identity stays the map key in `beatCaptions` instead of a third field the join would never read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No consumer or fixture is special-cased: both nulls stand for states the screenplay tree can hold, an uncaptioned beat and a beat outside every scene.

## @evidence contracts/development/common.md#meaningful-documentation

The prose names the producer and the reader of the record, and each member says what its null means.
