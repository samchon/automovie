# src/recovery/IAutoMovieRecoveryChartPhysicalJet.ts#IAutoMovieRecoveryChartPhysicalJet.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation establishes the original physical and UV frames, local leaf scales, physical derivative targets and area and conditioning diagnostics.

## @evidence contracts/development/design.md#principled-representation

For physical edge matrix K = QR, the UV edge matrix times inverse R gives the change of chart coordinates per unit tangent. The returned operators and targets use the same exchange length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source triangle provides one reusable tangent frame. Observation integration reuses it for clipped children and emits derivative rows without publishing triangle incidence.
