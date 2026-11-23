# src/physics/IAutoMoviePhysicalShape.ts#IAutoMoviePhysicalShape

## @evidence contracts/development/design.md#principled-representation

The closed kind union admits only dimensions needed by each solid while sharing local rigid placement, identity and physical material.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Profile validation, native collider creation and geometric audits consume the same four solid descriptions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No renderer mesh or arbitrary nonconvex triangle soup is presented as a supported physical solid; hull admission verifies a three-dimensional boundary.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies shape-local coordinates, metre extents, capsule direction, material identity and solid-core obligations.
