# src/recovery/observation/IAutoMovieRecoverySavedCurveBinding.ts#IAutoMovieRecoverySavedCurveBinding

## @evidence contracts/development/common.md#meaningful-documentation

Replay evidence binding one ordered contour to its saved cubic curve. Station coordinates, fitted phases, widths and endpoint jets use the declared millimetre/source-parameter clocks. Status distinguishes exact saved-cubic binding from unavailable evidence; historical trace verification remains explicitly false when present.

## @evidence contracts/development/design.md#principled-representation

Station coordinates, fitted phases, widths and endpoint jets use the declared millimetre/source-parameter clocks. Status distinguishes exact saved-cubic binding from unavailable evidence; historical trace verification remains explicitly false when present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

bindRecoveryOrderedFits reports completed stages, accepted sample maps and endpoint jets consumed by source-lineage checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional evidence belongs to completed replay stages; unavailable records may retain partial stages, so status does not imply every optional field exists. Replay is not a historical acceptance certificate.
