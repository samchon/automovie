# src/fluid/sampleFluidDomain.ts#sampleFluidDomain

## @evidence contracts/development/implementation.md#principled-implementation

Rejects non-finite time, clamps finite negative time to zero, then floors the quotient plus 1e-9. The allowance shifts each representable boundary slightly earlier, so matching converted steps select the same state without asserting exact floor semantics or cross-host identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the second-to-step conversion and delegates the solve to `simulateFluidDomain`, so a seek by step and a seek by second share one integrator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fixed 1e-9 step-fraction allowance and negative-time clamp are explicit clock policy for all domains; the allowance is not a measured error bound and may change a genuinely pre-boundary sample.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the exact conversion formula, pre-boundary allowance, frame-rate-independent step selection, caller admission and negative/non-finite/over-budget behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Conversion takes constant work; replay costs O(cells + faces + step * (cells + faces + sources + drains)) time and O(cells + faces) storage, including allocation and final copying at step zero.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Shares nothing across calls; the stateless replay and its cost are answered on `simulateFluidDomain`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned state is the integrator's fresh record.
