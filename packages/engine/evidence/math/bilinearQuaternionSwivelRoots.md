# src/math/bilinearQuaternionSwivelRoots.ts#bilinearQuaternionSwivelRoots

## @evidence contracts/development/common.md#meaningful-documentation

States the dot ordering, quaternion half-angle circle, Gram premises, degree interval, all/no-root/refusal meanings and the consumer's physical verification responsibility.

## @evidence contracts/development/implementation.md#principled-implementation

Eberly, Constrained Quaternions Using Euler Angles, sections 2.3 and 3.3, https://www.geometrictools.com/Documentation/ConstrainedQuaternions.pdf, expresses the two-axis quaternion as a bilinear half-angle product. Applying the two Gram block adjugates recovers that product up to a common factor. Its determinant on a circle is u+v*cos(psi)+w*sin(psi), solved by phase and acos. Conservative forward-error separation refuses tangencies and cancellation; exact dyadic product signs alone certify an identically zero polynomial.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This module owns only circle/rank intersection. One scale bounds all arithmetic, one adjugate maps each circle coefficient, and one trigonometric equation supplies at most two proposals; the actual IK consumer retains feasibility and fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling, fixture branch, fitted coefficient, clamped acos argument or tolerance-created zero/root is used. The epsilon bound only refuses numerically unresolved arithmetic; exact identity uses the original finite inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four-component input and at most two output angles give constant arithmetic and storage. Only an uncertain near-zero polynomial invokes up to three fixed-size exact dyadic sign calculations; no measured speedup is claimed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One synchronous circle query owns no equivalent external or repeated work to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All four-component vectors, exact-sign terms and at most two scalar roots belong to the call; no input, cache, handle or task is retained.
