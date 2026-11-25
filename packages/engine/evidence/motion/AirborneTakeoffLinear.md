# src/motion/AirborneTakeoffLinear.ts#AirborneTakeoffLinear

## @evidence contracts/development/implementation.md#principled-implementation

Preserves fixed-grid Simpson and uses the shared adaptive Simpson/Richardson estimator for an adaptive request. Matrix error times a projected seed-norm bound over request shares zero through one plus lag error has angular units and is compared with the public shooting budget. The affine seed's endpoint norms bound its interior by convexity, retained by radial projection for nonnegative ceilings; the quadrature estimate still assumes smoothness and is not a continuous certificate or Newton-convergence guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One physical integrand serves fixed weighting or adaptive quadrature; one unpacker and the existing three-variable solve measure the current seed's estimated angle error.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every node uses actual history, sharing only an exactly equal preceding fixed endpoint or an adaptive parent's actual samples. No guessed mean inertia, time quantization, per-component relative floor, fixed-rate adaptive seed or weakened physical integration budget is introduced; unsampled structure can still fool the estimator, and final nonlinear shooting remains authoritative.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed mode retains 3K weighted contributions and shares exact adjacent endpoints, normally 2K+1 reads. Adaptive mode starts with five reads and adds four per split. Its native error has two nonnegative components, permitting ancestor-only aggregate updates and valid current-weight bound search instead of rescoring every leaf; worst-case search can still be linear. Both endpoint seed norms are computed once per changed whole integral. End-to-end gain remains unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unobserved factory tensors share their SPD factor: three takeoff-basis solves form the inverse columns directly and one relative-momentum solve forms the lag, without eigensolves or inverse-matrix materialization. The into-frame basis is prepared once on first use. Public principals retain the original rotated-tensor path. Fixed mode reuses only an exactly equal preceding endpoint; adaptive children reuse actual parent samples and half rules.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The adaptive call owns numeric samples and estimates plus one current-integral/seed-norm pair; fixed mode holds at most one endpoint time and its inverse tensor/relative rate. All are released on return or throw. Only the two numeric result arrays escape, with no cross-call cache or handle.

## @evidence contracts/development/common.md#meaningful-documentation

States the linear relation, both integrals, frames and units.
