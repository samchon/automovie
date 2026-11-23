# src/geometry/IAutoMovieMeshTransform.ts#IAutoMovieMeshTransform

## @evidence contracts/development/design.md#principled-representation

Scale, rotate, translate is the standard affine order for a rigid member, and `transformAutoMovieMesh` follows it with inverse-transpose normals and a winding flip for a mirroring scale, so outward faces stay outward under every admitted placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three optional fields each defaulting to identity, so a member that only needs moving names only its translation; the record is shared by mesh parts, portrait optics and face-preserving placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A non-unit rotation is refused rather than normalized and a collapsing scale is refused rather than clamped, so a malformed placement cannot silently produce a different pose.

## @evidence contracts/development/common.md#meaningful-documentation

States the application order, each field's unit and default, the normal and winding rules, the UV consequence of scaling, and every refusal with its tolerance.
