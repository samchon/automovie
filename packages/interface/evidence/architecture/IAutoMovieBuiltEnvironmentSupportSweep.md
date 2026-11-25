# src/architecture/IAutoMovieBuiltEnvironmentSupportSweep.ts#IAutoMovieBuiltEnvironmentSupportSweep.IProps

## @evidence contracts/development/design.md#principled-representation

groundY is finite world Y in metres, defaulting to zero; tolerance is finite nonnegative metres, defaulting to 1e-9, with RangeError admission in builtEnvironmentSupportSweep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sweep borrows the environment and exposes only the two numerical policies used to classify its part-box support candidates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Grounding includes bodies below the plane; union footprints and part boxes are proxies, so the result is not a structural support or continuous-contact proof.

## @evidence contracts/development/common.md#meaningful-documentation

Building-wide support scan with an optional world ground plane and contact slack. groundY is finite world Y in metres, defaulting to zero; tolerance is finite nonnegative metres, defaulting to 1e-9, with RangeError admission in builtEnvironmentSupportSweep.
