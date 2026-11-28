# src/fitting/AutoMovieRecoveryChartFit.ts#AutoMovieRecoveryChartFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

Fit a registered chart to weighted millimetre observations and optional physical-gradient rows. Admission checks the finite enclosure, fixed points, observed and validation positions, chart addresses and fitting budgets. Check-only validation positions may lie outside the control enclosure. The result retains sampled residual, observed rank and projected-gradient findings when a valid fit is unqualified.

## @evidence contracts/development/implementation.md#principled-implementation

Prepare one enclosure and reduced coefficient registry, assemble its sparse weighted rows, solve the bounded original problem and measure physical residuals. The resulting chart report supplies the accepted geometric and numerical qualifications separately.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse the normalized registry across assembly, solving and publication. Retain only the sparse system and bounded diagnostics needed for the returned chart.
