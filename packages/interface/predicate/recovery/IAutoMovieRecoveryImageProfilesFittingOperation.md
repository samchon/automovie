# src/recovery/IAutoMovieRecoveryImageProfilesFittingOperation.ts#IAutoMovieRecoveryImageProfilesFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The callable identifies the four millimetre input fields, the required source population and fitted metre output. Its rank field names the QR diagonal ratio, and the fit rejects nonpositive radius controls.

## @evidence contracts/development/design.md#principled-representation

Recovery fits all four profiles in the same clamped cubic spline space using Householder QR of the original design. It converts each piece's endpoint and derivative values to cubic Bernstein coefficients, then applies the millimetre-to-metre conversion. Positive radius controls qualify their full spans before packaging the elliptic loft.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callable consumes the section-family samples and stated spline and rank settings. It returns one elliptic loft and its numerical rank measure. The surrounding image fit owns source calibration, measured image residuals and acquisition coverage.
