# src/human/generation/trunk/IAutoMovieHumanTrunkTape.ts#IAutoMovieHumanTrunkTape.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the solve reads.

## @evidence contracts/development/design.md#principled-representation `producer`: Producer and site, for the diagnostic. `plane`: Actual common world-Y section family, authored before the attached originals. `masses`: The original masses whose common-level side cuts the tape also wraps.

`contour` carries the native section reader through a local feature operator on each actual trial section. The tape reads the same contour that the trunk publishes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkLegs.trial, AutoMovieHumanTrunkTape.parent. Read by AutoMovieHumanTrunkTape.solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `parents`: Actual horizontal cuts of other original parents, retaining their source names and explicit unavailability.

# src/human/generation/trunk/IAutoMovieHumanTrunkTape.ts#IAutoMovieHumanTrunkTape.IMass

## @evidence contracts/development/common.md#meaningful-documentation

A mass at the site.

## @evidence contracts/development/design.md#principled-representation `part`: Identical original source, calibration mm. `view`: Its actual production declaration, used to admit the fixed AP chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkTape.cut.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `part`, `view`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkTape.ts#IAutoMovieHumanTrunkTape.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The solved shoulder and its diagnostics.

## @evidence contracts/development/design.md#principled-representation `shoulder`: The base's common shoulder, or null when its source/reach/root is not admitted. `diagnostics`: One diagnostic for a tape outside the reach or a box without a valid section.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkTape.solve. Also types AutoMovieHumanTrunkBuild.tape, AutoMovieHumanTrunkTape.parentError.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `shoulder`, `diagnostics`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkTape.ts#IAutoMovieHumanTrunkTape.ParentRecords

## @evidence contracts/development/common.md#meaningful-documentation

Project one actual parent cut into tape points and matching provenance without solving or constructing the parent again.

## @evidence contracts/development/design.md#principled-representation

Project one actual parent cut into tape points and matching provenance without solving or constructing the parent again. Alternatives are readonly { point: [number, number]; station: number; phase: number; }[]; string.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkTape.ParentRecords is the canonical exchange used by AutoMovieHumanTrunkTape.parent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkTape.parent for project one actual parent cut into tape points and matching provenance without solving or constructing the parent again.
