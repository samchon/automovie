# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IStationJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains component order, shared station and scalar units.

## @evidence contracts/development/design.md#principled-representation

ViewSectionField.prepare consumes these values from actual extent and effective shoulder readers and turns each into a station-variable conic field jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same three-number layout serves both length and dimensionless scalars, with no frame or phase coordinate attached.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IRadialJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies every coordinate and derivative ordinal in the fixed six-value result.

## @evidence contracts/development/design.md#principled-representation

ViewSectionReading evaluates the same conic ray with station-variable source data and returns total order two in station and polar phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tuple supplies the local polar derivatives needed by Cartesian section readers. World frame placement is a separate owner.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IRead

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both result representations and their use.

## @evidence contracts/development/design.md#principled-representation

ViewSectionField.read selects a ray from its prepared numeric geometry. It returns the derivative tuple or a named failure for rejected preparation, ray selection or derivative evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union reuses the conic field failure record so downstream readers can preserve the owner and diagnostic.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives data lifetime and provenance required by the ray-aware read path.

## @evidence contracts/development/design.md#principled-representation

ViewSectionField.prepare creates the station-variable conic preparation, then derives its primal geometry. ReadRay evaluates a ray selected from that same primal geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result stores both representations because one selects the numeric branch and the other evaluates physical partials at that branch.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IPrepared.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the variant capable of later ray reads.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IPrepared.source

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the derivative data carried through the source algebra.

# src/construction/IAutoMovieViewSectionField.ts#IAutoMovieViewSectionField.IPrepared.geometry

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the representation used in numeric ray selection.
