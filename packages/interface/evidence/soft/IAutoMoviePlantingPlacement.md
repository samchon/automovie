# src/soft/IAutoMoviePlantingPlacement.ts#IAutoMoviePlantingPlacement

## @evidence contracts/development/design.md#principled-representation

arrangePlantingCluster preserves the accepted slot index and derives translation, normalized yaw quaternion and independently sampled positive axis scales; the viewer composes this transform with recipe-frame plant geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The placement stores only an instance transform and identity, allowing one grown structure to serve every accepted member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rejected slots are absent rather than represented by invented placements; scale axes are retained rather than reduced to a scalar.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish stable identity from authored slot and identify world translation, glTF quaternion order and positive scales.
