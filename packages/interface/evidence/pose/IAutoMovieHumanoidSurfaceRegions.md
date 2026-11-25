# src/pose/IAutoMovieHumanoidSurfaceRegions.ts#IAutoMovieHumanoidSurfaceRegions.IStation

## @evidence contracts/development/common.md#meaningful-documentation

States the two forms a station takes.

## @evidence contracts/development/design.md#principled-representation

A bone, the joint it leans toward or the bounds centre, and a share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members the surface resolver reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bones are the interface's closed bone union.

# src/pose/IAutoMovieHumanoidSurfaceRegions.ts#IAutoMovieHumanoidSurfaceRegions.IDefinition

## @evidence contracts/development/common.md#meaningful-documentation

States what the pair defines.

## @evidence contracts/development/design.md#principled-representation

A ray: an origin on the segment, by a share of it or by a level of the body's stature, and a direction in the rest frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members a region needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; the point itself is read from the colliders, never stored.

# src/pose/IAutoMovieHumanoidSurfaceRegions.ts#IAutoMovieHumanoidSurfaceRegions.ILevel

## @evidence contracts/development/common.md#meaningful-documentation

States what the level means, its frame (rest, floor at zero) and why a landmark is placed by it.

## @evidence contracts/development/design.md#principled-representation

A bone, the child joint it leans toward and a dimensionless share of stature; the surface resolver reads the stature off the body's colliders as `measureAutoMovieHumanoidBody` does.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members the surface resolver reads; the trunk's lower rib regions use it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bones are the interface's closed bone union; a level outside the segment's span is refused by the resolver, not clamped.
