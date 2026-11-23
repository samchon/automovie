# src/pose/IAutoMovieFitDigitToTarget.ts#IAutoMovieFitDigitToTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines rest-local effector geometry, world target, optional orientation/coupling tasks and softening rate.

## @evidence contracts/development/design.md#principled-representation

Clinical variables use degrees and target residual metres; fitDigitToTarget rejects empty bones/invalid rate and requires a resolvable effector, with coherent FK frames caller-owned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The digit solver consumes these inputs to prioritize point placement before normal alignment and flexion coupling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Independent normal/coupling/rate options activate distinct secondary or reach-softening behavior without requiring a named finger special case.

# src/pose/IAutoMovieFitDigitToTarget.ts#IAutoMovieFitDigitToTarget.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes clamped clinical joints from achieved world point/normal and the original-target residual.

## @evidence contracts/development/design.md#principled-representation

Joints use clinical degrees, point metres and normal world direction; residual remains measured against the original target even when softening is enabled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitDigitToTarget returns fresh fitting results without changing the source pose; downstream contact logic decides whether residual is acceptable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reach failure is measurable data rather than a forced success flag or a hidden change to the requested target.
