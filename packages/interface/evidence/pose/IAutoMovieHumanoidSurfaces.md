# src/pose/IAutoMovieHumanoidSurfaces.ts#IAutoMovieHumanoidSurfaces.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

Defines rest-local point and unit directions plus optional socket heading and region extent.

## @evidence contracts/development/design.md#principled-representation

Bone identity selects the rest frame; point/radius are metres and directions dimensionless. Generated frames carry region radius only when it is a region extent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidSurfaces creates these frames from physical geometry; its place helper applies a resolved bone transform.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Existing humanoid bone identifiers and vector contracts carry the frame without a renderer handle.

# src/pose/IAutoMovieHumanoidSurfaces.ts#IAutoMovieHumanoidSurfaces.ISurfaces

## @evidence contracts/development/common.md#meaningful-documentation

Separates all region frames from all socket frames for one body's geometry.

## @evidence contracts/development/design.md#principled-representation

Closed region/socket records require every supported key; entries use their own bone-local frames rather than one world snapshot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The humanoid surface resolver fills both records for downstream contact and attachment targeting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Region and socket vocabularies reuse canonical key unions instead of allowing arbitrary missing entries.

# src/pose/IAutoMovieHumanoidSurfaces.ts#IAutoMovieHumanoidSurfaces.ITangent

## @evidence contracts/development/common.md#meaningful-documentation

Defines up/out offsets on the region tangent plane, including the near-vertical fallback.

## @evidence contracts/development/design.md#principled-representation

Offsets are metres; the basis comes from projected rest +Y or +Z and their cross product with outward direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidSurfaces.offset uses these offsets to cast a new ray against the region's physical surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two tangent coordinates avoid pretending an offset is a world position or preserving the original region radius.

# src/pose/IAutoMovieHumanoidSurfaces.ts#IAutoMovieHumanoidSurfaces.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

States world units and exact propagation of optional forward direction.

## @evidence contracts/development/design.md#principled-representation

The placed point is metres and directions are rotated local vectors; unit length depends on the input frame and bone quaternion premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieHumanoidSurfaces.place allocates this result from a local frame and posed bone without retaining them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing forward direction remains absent instead of constructing an arbitrary orientation.
