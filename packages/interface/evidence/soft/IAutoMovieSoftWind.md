# src/soft/IAutoMovieSoftWind.ts#IAutoMovieSoftWind

## @evidence contracts/development/design.md#principled-representation

windAxis divides the declared direction by its direct-square Euclidean length, and windAcceleration adds the triangular wave 4 * abs(fract(gustHz * time) - 0.5) - 1 times gustAcceleration to the steady acceleration; finite nonzero normalization and phase intermediates remain numerical premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One uniform acceleration vector and scalar wave parameters express the implemented draught without introducing a spatial fluid field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The force is not normal-dependent lift or drag; zero frequency holds the positive gust peak rather than silently disabling its amplitude.

## @evidence contracts/development/common.md#meaningful-documentation

Members state normalized-direction input, acceleration units, nonnegative gust amplitude/frequency and the zero-frequency behavior.
