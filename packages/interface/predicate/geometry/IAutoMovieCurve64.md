# src/geometry/IAutoMovieCurve64.ts#IAutoMovieCurve64.PieceMetadata

## @evidence contracts/development/common.md#meaningful-documentation

The record separates optional normalized local-domain metadata from an optional source q extent.

## @evidence contracts/development/design.md#principled-representation

Full curve admission checks the explicit local interval against [0,1] and requires finite increasing q bounds. The piece evaluator computes derivatives in local t without applying q scaling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only optional source provenance is shared. Enclosing phase conversion and the coefficient representation remain with their respective owners.

# src/geometry/IAutoMovieCurve64.ts#IAutoMovieCurve64.PieceMetadata.parameterDomain

## @evidence contracts/development/common.md#meaningful-documentation

The optional pair explicitly denotes the admitted normalized local interval from zero through one.

# src/geometry/IAutoMovieCurve64.ts#IAutoMovieCurve64.PieceMetadata.qInterval

## @evidence contracts/development/common.md#meaningful-documentation

The optional increasing source extent preserves provenance while the local derivative remains per normalized t.
