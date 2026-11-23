# src/human/generation/hand/IAutoMovieHumanHandVector.ts#IAutoMovieHumanHandVector

## @evidence contracts/development/common.md#meaningful-documentation

Describes planar point pairs read by the hand's convex-hull tape calculation; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Planar point pairs read by the hand's convex-hull tape calculation. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHandVector; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HandVector contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/hand/IAutoMovieHumanHandVector.ts#IAutoMovieHumanHandVector.HullPoints

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed planar section points [x, y] in millimetres. The hand tape reader takes the perimeter of their convex hull, so their input order need not trace a polygon.

## @evidence contracts/development/design.md#principled-representation

Borrowed planar section points [x, y] in millimetres. The hand tape reader takes the perimeter of their convex hull, so their input order need not trace a polygon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHandVector.HullPoints is the canonical exchange used by AutoMovieHumanHandVector.hull.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanHandVector input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
