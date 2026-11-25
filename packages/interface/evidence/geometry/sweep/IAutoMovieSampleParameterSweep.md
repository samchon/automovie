# src/geometry/sweep/IAutoMovieSampleParameterSweep.ts#IAutoMovieSampleParameterSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Unscaled metre section coordinates are averaged over dimensionless u/v spacing and placed in a live model-metre frame. Registration admits finite nonnegative spacing; writes admit scales and generated coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSweep supplies its existing frame and scale registries so parameter-correspondence sampling retains signed Cartesian shape instead of reconstructing a polar radius.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Signed cancellation to the section origin is valid; only unrepresentable nonzero results are refused, and failed evaluation does not publish partial XYZ output.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies callback timing and live-buffer ownership, scalar frame offsets, spacing units and transactional output behavior.
