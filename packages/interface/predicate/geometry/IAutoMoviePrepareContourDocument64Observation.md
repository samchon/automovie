# src/geometry/IAutoMoviePrepareContourDocument64Observation.ts#IAutoMoviePrepareContourDocument64Observation

## @evidence contracts/development/common.md#meaningful-documentation

The record describes a borrowed saved-section cubic and its copied signed material winding.

## @evidence contracts/development/design.md#principled-representation

Document preparation assigns the original cubic reference and winding to the new observation. Sampling reads the coefficients and later uses the sign to orient ring order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The observation only binds the input curve to this section's declared orientation. Samples, phases, and emission buffers remain separate.

# src/geometry/IAutoMoviePrepareContourDocument64Observation.ts#IAutoMoviePrepareContourDocument64Observation.curve

## @evidence contracts/development/common.md#meaningful-documentation

The source cubic reference stays borrowed in millimetres. Its coefficients must remain stable until sampling is complete.

# src/geometry/IAutoMoviePrepareContourDocument64Observation.ts#IAutoMoviePrepareContourDocument64Observation.winding

## @evidence contracts/development/common.md#meaningful-documentation

The copied authored sign distinguishes outer and cavity orientation in downstream sampling and correspondence.
