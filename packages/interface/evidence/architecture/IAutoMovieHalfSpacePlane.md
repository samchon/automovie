# src/architecture/IAutoMovieHalfSpacePlane.ts#IAutoMovieHalfSpacePlane

## @evidence contracts/development/design.md#principled-representation `builtSpaceContainsPoint` tests each cell plane's dot product against `offset + 1e-9`. Building validation requires finite components, finite computed normal length above 1e-12, finite offset and at least four planes. Analysis `validateSolidPlanes` shares the component/offset/count rules but its direction collector rejects only a finite computed length at or below 1e-12, so finite components with an overflowing norm are not refused by that rule. Neither proves a bounded, nonempty intersection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One normal and one offset express any half-space in the inequality form both consumers evaluate directly, so cells and occluders share this record instead of each defining a plane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cell containment keeps authored normal scale, so scaling an equivalent inequality changes its physical slack. Vertex enumeration separately normalizes and ignores normals at or below its 1e-6 observation tolerance, larger than validation's 1e-12 floor; admitted containment and enumerated bounds can therefore differ. Binary64 dot products can round or overflow and are not an exact numerical certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States the inside convention, both consumers, the containment slack and how normal length scales it, the minimum plane count, and that boundedness is not validated.
