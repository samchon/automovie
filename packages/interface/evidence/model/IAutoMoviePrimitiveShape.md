# src/model/IAutoMoviePrimitiveShape.ts#IAutoMoviePrimitiveShape

## @evidence contracts/development/design.md#principled-representation

A discriminated union carries precisely each primitive's dimensions in local metres; validateExtents checks positive finite dimensions before tessellate dispatches to deterministic triangle construction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The six shape records keep unrelated dimensions out of each arm, while mesh geometry owns free-form topology; resolution is an engine concern rather than another authoring parameter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union declares geometric shapes independently of fixtures or subjects; the capsule's cylindrical body and hemispherical ends retain their declared dimensions in engine tessellation.

## @evidence contracts/development/common.md#meaningful-documentation

States the concise recipe-versus-explicit-mesh distinction, type discriminator, metre dimensions and strict positivity, with each arm documenting its axes and parameter meaning.
