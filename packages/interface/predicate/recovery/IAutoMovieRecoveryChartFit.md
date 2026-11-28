# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input

## @evidence contracts/development/common.md#meaningful-documentation

The input states which controls are fixed, how dependencies reduce them, the chart row types, the physical enclosure and separate convergence and residual thresholds.

## @evidence contracts/development/design.md#principled-representation

Positive weighted local observations evaluate fixed tensor patch nets. Acyclic affine relations replace dependent controls by independent slots and fixed constants before the solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns source positions and authority controls. The fitter owns reduced numerical inputs, a sampled residual report and generated coefficients.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.controls

## @evidence contracts/development/common.md#meaningful-documentation

Preparation preserves fixed values and assigns solver slots only to controls left independent after relation reduction.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.initialControlsMm

## @evidence contracts/development/common.md#meaningful-documentation

Solution reads starts by original independent ID and normalizes each to the enclosure coordinates.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.relations

## @evidence contracts/development/common.md#meaningful-documentation

Preparation expands signed identities, folds fixed contributions and rejects a fixed control with a second dependent owner.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.relationBudget

## @evidence contracts/development/common.md#meaningful-documentation

Preparation uses a default stencil cap of 128 with relations, or 16 without them. Relation expansion has its own term and depth budgets.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.patches

## @evidence contracts/development/common.md#meaningful-documentation

System assembly visits the shared registry through each patch's local Bernstein basis index.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.observations

## @evidence contracts/development/common.md#meaningful-documentation

Weighted rows enter the shared Gram matrix. Physical tangent rows use their own signed basis operators and millimetre targets.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.validation

## @evidence contracts/development/common.md#meaningful-documentation

The report evaluates these rows after solving, allowing them to contribute to the observed maximum without changing the fitted RMS objective.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.enclosureMm

## @evidence contracts/development/common.md#meaningful-documentation

The enclosure establishes midpoint and common normalization scale, bounds fixed and independent controls, and is checked again after recreating dependents.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

Qualification compares the largest measured fit or validation residual against this physical limit.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.gradientTolerance

## @evidence contracts/development/common.md#meaningful-documentation

The result checks this threshold against the projected gradient evaluated in the original normalized box.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input.maxIterations

## @evidence contracts/development/common.md#meaningful-documentation

The box solver counts projected proposals, including a rejected momentum proposal.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result

## @evidence contracts/development/common.md#meaningful-documentation

The record gives the exact qualification dependencies, physical and normalized units, and the scope of its private worst-sample and optimality diagnostics.

## @evidence contracts/development/design.md#principled-representation

Separate objective, validation, rank and enclosure reports retain reasons when fitted coefficients are available but qualification fails.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fitted registry is usable by the chart compiler. Original sample witnesses and solver accounting stay as diagnostic records.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.controls

## @evidence contracts/development/common.md#meaningful-documentation

Reconstruction copies original fixed coordinates and evaluates each dependent expression in the restored physical coordinates.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.qualified

## @evidence contracts/development/common.md#meaningful-documentation

The report tests exact dependent enclosure, both full numerical ranks, the projected gradient and the largest sampled position error.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.iterations

## @evidence contracts/development/common.md#meaningful-documentation

The solver counts projected work against the declared budget, including a proposal that can trigger momentum restart.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.projectedGradient

## @evidence contracts/development/common.md#meaningful-documentation

Qualification measures the gradient step after projecting to the supplied original box.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.rmsMm

## @evidence contracts/development/common.md#meaningful-documentation

Only weighted fitting position rows contribute to this mean square. Validation can change maximum diagnostics separately.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.physicalJetRmsMm

## @evidence contracts/development/common.md#meaningful-documentation

The report recomputes signed derivative predictions and weights their squared physical residuals by the corresponding observation weight.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.objectiveRmsMm

## @evidence contracts/development/common.md#meaningful-documentation

Position and derivative squared sums are added before taking this root.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.physicalJetRows

## @evidence contracts/development/common.md#meaningful-documentation

System assembly increments this count when it streams each physical-gradient row.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.solve

## @evidence contracts/development/common.md#meaningful-documentation

The solver reports original and scaled row-sum estimates, observed Gram diagonals and momentum restarts.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.maximumMm

## @evidence contracts/development/common.md#meaningful-documentation

Every position sample from both configured populations can replace the maximum on a strict increase.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.unknownControls

## @evidence contracts/development/common.md#meaningful-documentation

The reduced coordinate map allocates one three-axis slot for each independent control ID.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.observationRank

## @evidence contracts/development/common.md#meaningful-documentation

Dense Gram work is conditional on its own size bound. The report keeps unavailable rank explicit.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.rankTolerance

## @evidence contracts/development/common.md#meaningful-documentation

Pivot selection scales this relative threshold by the largest Gram diagonal.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.gramPivotRatio

## @evidence contracts/development/common.md#meaningful-documentation

This reports the ratio of accepted Cholesky pivots rather than singular values.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.dataRowRank

## @evidence contracts/development/common.md#meaningful-documentation

The system orthogonalizes scaled observation rows apart from the Gram matrix to retain an independent rank test.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.dataQrDiagonalRatio

## @evidence contracts/development/common.md#meaningful-documentation

The row diagnostic uses twice-reorthogonalized data and keeps its diagonal ratio separate from the Gram pivot ratio.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.patchMaximumMm

## @evidence contracts/development/common.md#meaningful-documentation

The report initializes one maximum per supplied patch and evaluates fitting and validation positions in that patch.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.patchFreeSupportMaximumMm

## @evidence contracts/development/common.md#meaningful-documentation

A sample enters this maximum when a contributing positive basis coefficient refers to a control with independent terms.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.patchMaximumLocations

## @evidence contracts/development/common.md#meaningful-documentation

The report updates the stored UV only when a sample increases that patch's maximum.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.unsupportedControls

## @evidence contracts/development/common.md#meaningful-documentation

Unseen count comes from the assembled Gram diagonal and remains available if numerical rank is skipped.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.fixedSupportMaximumMm

## @evidence contracts/development/common.md#meaningful-documentation

The report evaluates position samples whose positive basis entries have no independent-control terms.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.freeSupportMaximumMm

## @evidence contracts/development/common.md#meaningful-documentation

This reduction measures rows influenced by at least one independent-control expression.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.maximumLocation

## @evidence contracts/development/common.md#meaningful-documentation

Ties leave the first maximum in observation traversal order.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.maximumWitness

## @evidence contracts/development/common.md#meaningful-documentation

The reporter composes the original position basis through its affine expressions and asks the reachable box operation about that single row.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.optimality

## @evidence contracts/development/common.md#meaningful-documentation

The original normalized gradient supplies the tangent support gap, which is rescaled to squared millimetres for the diagnostic.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.activeEnclosureControls

## @evidence contracts/development/common.md#meaningful-documentation

After the solve, comparison to each lower and upper normalized endpoint counts the whole control only once.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.dependentEnclosureViolationMm

## @evidence contracts/development/common.md#meaningful-documentation

After restoring affine controls, solution compares each coordinate with the original physical box.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.relationDiagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The result carries expansion observations from preparation, including signed weights and mass discrepancy.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.maximumRowTerms

## @evidence contracts/development/common.md#meaningful-documentation

System assembly counts reduced row addresses before applying the configured work cap.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.hessianNonzeros

## @evidence contracts/development/common.md#meaningful-documentation

The reporter sums stored map entries across Hessian rows.

# src/recovery/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The report retains lost support, rank and limit findings alongside the fitted registry.
