# src/motion/solveAirborneInvariant.ts#solveAirborneInvariant

## @evidence contracts/development/common.md#meaningful-documentation

States constructor proof, zero relative momentum, exact tensor-axis eligibility, units inherited from the flight, absent-result fallback, held endpoint reads and independent quaternion ownership. Its knot count is the exact curve's two interval boundaries rather than numerical accepted steps; only the start quaternion and fixed rate are stored. The requested/default step metadata is preserved.

## @evidence contracts/development/implementation.md#principled-implementation

From L=R I w with constant I and zero relative momentum, a principal-axis carried L gives constant w and R=R0 Exp((t-t0)w). Only native fixed-shape provenance plus actual zero tensor couplings, or actual equal diagonal entries with zero coupling, establishes this premise. At zero nominal momentum the exact sensitivity ODE reduces to eta'=I^-1 R0^T dL, so all requested columns are computed, including transverse ones. The stationary curve's reconstructed R(I*0+0) is exactly zero at all times; the existing defect owner admits an explicit budget and checks its actual start data. No arbitrary constant anisotropic spin is treated as commuting.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The entry checks supported inputs and tensor invariants; a separate numeric-only reader factory owns the completed analytic curve so playback captures neither a shape history nor physical preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No law, body, seed, requested angle, sampled equality, near symmetry or caller-provided proof flag selects the solution. Unsupported momentum directions, nonstationary sensitivities and rotating dense physical budgets return undefined to the unchanged integrator. The stationary zero-defect identity introduces no physical error floor or changed budget. Returned stationary sensitivities are actual inverse-inertia responses, never synthetic zero columns. Shooting still observes the actual curve, winding and momentum ceiling.

## @evidence contracts/development/implementation.md#efficient-algorithms

After the native owner's proof and any first O(S) shape reduction for S mass parts, eligibility uses three fixed-size tensor products, one physical solve and one solve per stationary sensitivity direction. An explicit stationary physical budget adds the existing defect owner's start-history query and fixed-size reconstruction. Playback retains O(k) numeric directions and takes O(k) work per tangent read; orientation reads take constant work. It does not traverse a time grid or claim a measured end-to-end speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The history owner lends its constructor-proven immutable constant tensor factor for the nominal rate and all stationary tangent directions. The completed flight copies only its normalized initial quaternion, fixed rates and scalar interval metadata; no input-dependent module cache is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Playback owns a fixed numeric interval, quaternion and nominal rate plus k requested tangent-rate records, and returns fresh quaternions, tangent arrays and tangent vectors. It retains no history, model, factor, callback or query population.
