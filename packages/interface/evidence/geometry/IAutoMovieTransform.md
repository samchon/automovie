# src/geometry/IAutoMovieTransform.ts#IAutoMovieTransform

## @evidence contracts/development/design.md#principled-representation

T · R · S with a unit quaternion and positive axis scales is mathematically invertible and orientation-preserving. Runtime validation admits near-unit rotations within 1e-6 rather than proving exact orthogonality, and binary64 underflow/overflow and sheared hierarchy products remain consumers' numerical and representation limits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three named parts instead of a 4x4 matrix keep each part checkable on its own and decomposable without numerical fitting, and one shape serves every placed record so a single validator covers them all.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted local record has no explicit shear, reflection or collapsed-scale field; this does not certify an arbitrary composed matrix as unsheared or numerically nonsingular. The owning record supplies parent identity and consumers retain their documented matrix/decomposition limits.

## @evidence contracts/development/common.md#meaningful-documentation

States application order, record owners, semantic joint distinction, unchanged scalar admission and derived-product/hierarchy limitations; members give metre translation, quaternion rotation and dimensionless scale.
