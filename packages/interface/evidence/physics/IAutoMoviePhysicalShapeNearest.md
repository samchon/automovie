# src/physics/IAutoMoviePhysicalShapeNearest.ts#IAutoMoviePhysicalShapeNearest.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the nearest shape point from the nearest point on the query segment.

## @evidence contracts/development/design.md#principled-representation

Signed distance is metres; point and at are world metres and normal is the world outward unit direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalShapeNearest returns this shared reading for projectile/contact geometry without native body ownership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Negative distance denotes entry into the solid; a nearest-surface reading alone is not a solver contact or impulse.
