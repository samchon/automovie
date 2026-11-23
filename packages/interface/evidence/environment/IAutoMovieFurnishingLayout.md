# src/environment/IAutoMovieFurnishingLayout.ts#IAutoMovieFurnishingLayout

## @evidence contracts/development/common.md#meaningful-documentation

States the floor-centred frame, units, useful room dimensions and admission owner. The members state the aisle default, the keep-out convention and how overrides select placements.

## @evidence contracts/development/design.md#principled-representation

Labelled XZ tuples distinguish room dimensions, keep-out rectangles and positioned props without transcribing the model geometry. Heading is a yaw relative to the host frame in degrees. The producer checks dimensions, finite coordinates, role identities and feasibility at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The common room input serves amenity producers. Reserved rectangles express the approach and swing spaces they must preserve, while named overrides serve selected objects without restating the layout of the rest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rectangular rooms and keep-outs are the explicit input domain. An override's obstacle check uses its turned bounding box conservatively, and the layout does not certify general navigation or accessibility compliance.
