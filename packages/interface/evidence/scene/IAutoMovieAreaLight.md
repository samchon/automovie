# src/scene/IAutoMovieAreaLight.ts#IAutoMovieAreaLight

## @evidence contracts/development/design.md#principled-representation

A finite positive local-XY rectangle with linear color and luminance maps to the viewer's rectangular area-light implementation; its aimed transform and dimensions determine the source rather than a punctual falloff range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends shared light identity and placement with only area discriminator and panel dimensions, leaving supported material response and renderer implementation at the light consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Area lights support physically based materials and no shadow map, so cast-shadow and punctual range semantics cannot be used to imitate another light kind.

## @evidence contracts/development/common.md#meaningful-documentation

Defines emitting plane and direction, meter extents, area-source intensity and material/shadow limitations.
