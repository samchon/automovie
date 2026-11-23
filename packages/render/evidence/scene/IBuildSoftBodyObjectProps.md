# src/scene/IBuildSoftBodyObjectProps.ts#IBuildSoftBodyObjectProps

## @evidence contracts/development/design.md#principled-representation

Requires Engine-derived surface data and its actual closed analysis status, with an optional borrowed material rather than a viewer-authored simulation result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Construction inputs are separate from the returned mutable projection and its update/disposal owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A default status cannot fabricate a solved cloth; supplied surface admission and anatomical/physical validity remain with the Engine producer, not this type declaration.

## @evidence contracts/development/common.md#meaningful-documentation

Fields name canonical surface, optional material ownership and the required outcome without implying hardware or solve proof from their presence.
