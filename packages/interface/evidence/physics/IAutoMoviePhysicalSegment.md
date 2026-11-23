# src/physics/IAutoMoviePhysicalSegment.ts#IAutoMoviePhysicalSegment

## @evidence contracts/development/design.md#principled-representation

A centre of mass, diagonal principal moments and a principal-axis rotation describe arbitrary rigid inertia without assuming the bone axes diagonalize it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native articulation construction and body-centre calculations read these fields; collider mass is incorporated in the segment rather than counted independently.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The segment uses arbitrary bone identity and explicit measured or derived inertia, without choosing a shape or mass from an anatomical name.

## @evidence contracts/development/common.md#meaningful-documentation

Defines neutral and inertia frames, kilograms, metre centre, kg m² moments and nonempty shapes.
