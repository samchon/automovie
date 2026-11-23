# src/production/IAutoMovieHumanoidSurfaceExtents.ts#IAutoMovieHumanoidSurfaceExtents.ReadBounds

## @evidence contracts/development/common.md#meaningful-documentation

Documents the callback frame, breadth use, repeated calls, exceptions, empty-shape sentinel and borrowed lifetime.

## @evidence contracts/development/design.md#principled-representation

A canonical humanoid bone selects model-rest axis bounds in metres; validatePhysicalProfile admits nonempty segment shapes, and callback providers must preserve finite ordered corners for a meaningful breadth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The extent calculation only reads a bone's min/max corners; collider construction and rig lookup stay with the surface-reader implementation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The 10 mm output floor is the contact policy, not a guarantee that invalid or empty collider geometry was admitted; callback failures are not converted into guessed boxes.
