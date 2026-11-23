# src/index.ts#createRecoveryCameraChart

## @evidence contracts/development/implementation.md#principled-implementation

Inverting the admitted upper-triangular pinhole equations gives exact algebraic ray coordinates; finite inverse entries, distinct unit steps and round trips at image corners test representability of the supplied chart in binary64. The bound covers arithmetic only, never physical calibration uncertainty.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chart owner constructs K/inverse once for consensus, refinement and triangulation, preserving one pixel-centre convention across those phases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No principal-point recentering, focal inference, epsilon reciprocal or image rotation repairs an unrepresentable chart.

## @evidence contracts/development/common.md#meaningful-documentation

States supplied-intrinsic premises, analytic inverse, pixel-step admission and arithmetic versus calibration uncertainty.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size inversion and five constant-size round trips precede all feature-pair work; no image scan or general matrix factorization is needed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returned K and inverse arrays are reused by every phase of the same camera-pair operation, with no global identity cache over mutable input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Two owned nine-number arrays transfer to the synchronous pair owner; no borrowed RGB, process, callback or global state is retained.
