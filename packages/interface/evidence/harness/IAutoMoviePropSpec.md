# src/harness/IAutoMoviePropSpec.ts#IAutoMoviePropSpec

## @evidence contracts/development/design.md#principled-representation `forgeProp` requires `model.id === node` and placement validation requires one set piece joining that node and model. Geometry uses authored footprint/clearance boxes when declared, otherwise proxy model-part vertices, together with model affordances and building records. Importing appearance does not replace these semantic measurements with external asset geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four concerns, each in its own member: the model with body and contact points, the articulation, the optional placement, and the optional external-appearance reference; the gates live in `forgeProp` and `validatePropPlacements`, not in this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A model carrying a skeleton is refused; an imported appearance needs a structurally coherent rigid closure, whose digest strings are checked without reading bytes. Registry resolution and byte provenance belong to production. The forge gate assumes typed nested records and checks articulation references, not every joint transform, profile numeric value or rendered host capability; success returns the caller's mutable spec rather than a deep immutable seal.

## @evidence contracts/development/common.md#meaningful-documentation

States what carries the prop's meaning, every `forgeProp` rule with its reason, the staging requirement, and what omitting `placement` or `modelRef` means.
