# src/validation/IAutoMovieModelColumn.ts#IAutoMovieModelColumn

## @evidence contracts/development/design.md#principled-representation

Radius and bottom/top describe an inscribed cylinder of the CPU tessellated rest solid: radial apothems and a sphere's centered inscribed ball constrain occupied space rather than outer envelopes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The column separates guaranteed occupied space from outer projection bounds, allowing the formation overlap gate to omit off-axis parts conservatively.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported/off-axis/nonunit ancestry, axial rotations whose actual horizontal gain is not one and unrepresentable primitive or scaled outer envelopes are omitted instead of guessed. This loses detections without changing authored rotation policy and does not repair extreme tessellator output or certify animation, GPU Float32 narrowing or the capsule's rounded silhouette.

## @evidence contracts/development/common.md#meaningful-documentation

Defines metre radius and finite bottom/top about the model origin, inscribed CPU rest-solid scope and omitted geometry rather than treating projection bounds as occupied space.
