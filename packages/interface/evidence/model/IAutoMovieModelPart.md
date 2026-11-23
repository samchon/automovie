# src/model/IAutoMovieModelPart.ts#IAutoMovieModelPart

## @evidence contracts/development/design.md#principled-representation

A part combines local geometry, a model-scoped material and attachment transform. The viewer uses skin only with attachedBone null; a nonnull attachedBone selects rigid parenting even if skin data is also supplied. Model admission checks both references but does not refuse that dual declaration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometry, appearance reference and attachment remain separate fields, allowing primitive and mesh parts in one model without duplicating materials or embedding world placement here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Material and bone ids resolve through their owning model rather than descriptive part names; a null material selects the viewer's ordinary default material instead of implying an unlit special case.

## @evidence contracts/development/common.md#meaningful-documentation

States model-scoped identity and material lookup, rigid-versus-skinned attachment, and the bone-or-root local transform with null identity, including default material behavior.
