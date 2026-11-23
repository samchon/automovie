# src/index.ts#fitRecoveryImageProfiles

## @evidence contracts/development/implementation.md#principled-implementation

The shared Householder spline fitter supplies metre Bernstein controls and rank diagnostics; positive radius controls preserve positive radii throughout each span by the Bernstein convex-hull property.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This family adapter owns ellipse field ordering and positivity while shared scalar fitting owns basis, QR and exact interval conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coefficient clamp, expected profile or independent per-field parameterization changes the fitted result; unsupported radius controls reject the candidate.

## @evidence contracts/development/common.md#meaningful-documentation

States four-field ordering, sufficient whole-span positivity and refusal without field modification; the delegated scalar owner documents units and numerical rank limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegated fitting costs O(N K squared + N K F) for F=4 and K=spans+3; O(spans) mapping/positivity work is linear in required output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One shared fit serves all four fields and returns the same common interval/endpoint identities.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scalar fit scratch dies with the call and mapped coefficient records transfer without handles or global retention.
