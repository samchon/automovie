# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable describes lazy iteration and the lifetime of the borrowed chart arrays and boundary owner.

## @evidence contracts/development/design.md#principled-representation

The generator yields network refusals from the fallback and mapped fit outcomes from registered charts. It uses the caller's policy for the latter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callable retains no result list. Callers may consume individual chart receipts while the batch keeps the boundary registry live.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The input names selected registered millimetre observations, the shared boundary owner and local fit policy.

## @evidence contracts/development/design.md#principled-representation

The network receives the chart positions and boundary ancestry; chord refinement and fitting use each registered chart and the same policy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input holds the declared graph and budget context together. It borrows the boundary registry without creating a second authority.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy

## @evidence contracts/development/common.md#meaningful-documentation

The policy states millimetres, degree threshold and positive work limits. Defaults are 250,000 area rows, four refinement rounds and zero gradient length.

## @evidence contracts/development/design.md#principled-representation

The solver applies these limits after boundary registration. Zero gradient length omits derivative rows; explicit patch or row exhaustion affects local fit work.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The policy carries the numerical thresholds needed by each fit. The resulting fit owns its local observations and qualified output.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The alias names network refusal, local map or fit refusal, and a fitted receipt.

## @evidence contracts/development/design.md#principled-representation

Each variant fixes chart, fit and reason availability according to the stage reached. Shared boundary qualification remains separately recorded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union gives the publisher a complete discriminant for the local outcome. It keeps reason and diagnostics where the operation measured them.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IBoundaryEvidence

## @evidence contracts/development/common.md#meaningful-documentation

The record describes stable name, shared qualification, measured millimetre displacement and the diagnostics observed during iteration.

## @evidence contracts/development/design.md#principled-representation

The batch tracks global network success independently of the later map or fit. Fallback can preserve a chart and its fit even though global qualification is false.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared evidence travels beside the local state. Its diagnostic list is the running network report during iteration.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal

## @evidence contracts/development/common.md#meaningful-documentation

The variant describes unavailable chart and fit, a boundary exception reason and the shared-network failure.

## @evidence contracts/development/design.md#principled-representation

An independent boundary retry can fail only after the shared network failed. No chart displacement or local fit exists in this branch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The refusal keeps the chart's requested identity and diagnostics without supplying private geometry.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitRefusal

## @evidence contracts/development/common.md#meaningful-documentation

The variant explains the retained chart, local reason and absent fit.

## @evidence contracts/development/design.md#principled-representation

The network registers a chart before chord refinement and fitting. A failure in those later operations returns the registered chart and reason with its network qualifications.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant carries the admitted registered chart for diagnostics and leaves fitted coefficients absent.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitted

## @evidence contracts/development/common.md#meaningful-documentation

The variant describes the refined chart, returned fit and independent fit and boundary qualifications.

## @evidence contracts/development/design.md#principled-representation

After the boundary network, chord refinement updates vertices, triangles and key addresses before fitting. The resulting chart and fit refer to that same refined observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This receipt owns the one chart's fit. The separate observation publisher selects the independent qualifications and transfers fitted geometry.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IInput.charts

## @evidence contracts/development/common.md#meaningful-documentation

Names the borrowed chart array with millimetre positions and boundary ancestry.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IInput.owner

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the common registry whose lifetime spans iteration.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IInput.fit

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared numerical policy for the local fit stage.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

Specifies positive finite requested positional discrepancy in millimetres.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.maxSpans

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the positive boundary span budget.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.cornerDegrees

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the angular corner threshold in degrees.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.maxPatches

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the positive coefficient patch budget per chart.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.maxIterations

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the positive numerical iteration budget per chart.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.maxObservationRows

## @evidence contracts/development/common.md#meaningful-documentation

Names the retained area-row budget with the 250,000-row default.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.maxRefinements

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the number of residual refinement rounds with the default of four.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitPolicy.physicalGradientLengthMm

## @evidence contracts/development/common.md#meaningful-documentation

Names the nonnegative millimetre gradient weight length with zero default.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IBoundaryEvidence.name

## @evidence contracts/development/common.md#meaningful-documentation

Carries the input chart identity into local results.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IBoundaryEvidence.sharedBoundaryQualified

## @evidence contracts/development/common.md#meaningful-documentation

Records whether the common boundary network succeeded.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IBoundaryEvidence.networkMaximumPointChangeMm

## @evidence contracts/development/common.md#meaningful-documentation

States the scope and millimetre units of maximum network displacement.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IBoundaryEvidence.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Carries the running shared-boundary diagnostics during iteration.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.type

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the branch that produced no registered chart.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.chart

## @evidence contracts/development/common.md#meaningful-documentation

Declares null because registration refused the chart.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.fit

## @evidence contracts/development/common.md#meaningful-documentation

Declares null because fitting did not start.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.reason

## @evidence contracts/development/common.md#meaningful-documentation

Carries the independent boundary admission failure.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.sharedBoundaryQualified

## @evidence contracts/development/common.md#meaningful-documentation

Declares false after the shared network and local registration refuse.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.INetworkRefusal.networkMaximumPointChangeMm

## @evidence contracts/development/common.md#meaningful-documentation

Declares zero because no displacement was measured for that chart.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitRefusal.type

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a refusal after the chart reached local mapping or fitting.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitRefusal.chart

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the network-admitted chart before local refinement.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitRefusal.fit

## @evidence contracts/development/common.md#meaningful-documentation

Declares null for the incomplete fit.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitRefusal.reason

## @evidence contracts/development/common.md#meaningful-documentation

Carries the local map, chord or fitting failure.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitted.type

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a receipt with a computed fit.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitted.chart

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the refined chart and updated physical vertex keys.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitted.fit

## @evidence contracts/development/common.md#meaningful-documentation

Carries the computed fit, whose own qualification can be read independently.

# src/recovery/IAutoMovieRecoveryChartBatch.ts#IAutoMovieRecoveryChartBatch.IFitted.reason

## @evidence contracts/development/common.md#meaningful-documentation

Declares null because a local failure did not prevent the fit receipt.
