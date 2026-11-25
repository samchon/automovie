# src/human/generation/trunk/IAutoMovieHumanGlutealCut.ts#IAutoMovieHumanGlutealCut.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

One horizontal-cut point and the actual source chart that produced it.

## @evidence contracts/development/design.md#principled-representation `point`: World X/Z in calibration millimetres. `station`: Physical station of the identical original source, calibration mm. `phase`: Original local polar phase, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanGlutealCut.records. Also types AutoMovieHumanGlutealCut.cut, AutoMovieHumanGlutealCut.points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `station`, `phase`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanGlutealCut.ts#IAutoMovieHumanGlutealCut.CreateResult

## @evidence contracts/development/common.md#meaningful-documentation

Preserve the existing point-only consumer without preparing another field or solving another cut.

## @evidence contracts/development/design.md#principled-representation

Preserve the existing point-only consumer without preparing another field or solving another cut. Alternatives are [number, number][]; string.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanGlutealCut.CreateResult is the canonical exchange used by AutoMovieHumanGlutealCut.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanGlutealCut.create for preserve the existing point-only consumer without preparing another field or solving another cut.
