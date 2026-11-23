# src/kinematics/resolveAutoMovieMomentumRates.ts#resolveAutoMovieMomentumRates

## @evidence contracts/development/common.md#meaningful-documentation

States SI units, common-frame and same-instant/model premises, bone-origin versus part-centre rates, actual principal orientation, fresh ownership, zero-mass behavior and admission failures. The returned existing momentum record represents this instant rather than an interval midpoint.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid kinematics gives v_part=v_bone+omega cross rotated_offset. Linear momentum is sum(m*v), COM velocity is that sum divided by total mass, and centroidal angular momentum is sum(I_common*omega+(r-C) cross m*(v-V)). The shared physical tensor owner supplies I_common*omega from each actual principal frame. Binary64 overflow is refused and cancellation has its ordinary floating-point limit; no finite difference or smoothness assumption enters this reduction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capture each ordered part's current common-frame rates while reducing linear momentum, then use the resulting COM velocity in one orbital-plus-spin pass. Mass posing, bone-rate propagation and intrinsic tensor rotation retain their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment contributes according to its actual mass and inertia, without body/action switches, cutoffs, guessed missing rates, repaired values, fitted coefficients or altered tolerances. Invalid mass, missing inputs and nonfinite arithmetic throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two O(S) ordered passes over S parts capture O(S) current rates and reduce momentum. Two passes are needed to subtract the computed COM velocity before orbital accumulation. Intrinsic spin delegates to the existing scalar tensor product without constructing a composite tensor or principal eigensolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the already posed mass centres, masses, principal moments and actual principal rotations from the same model/instant. Current numeric rates are captured once per part for both reductions; no result, time, pose identity or approximate dependency key is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only this synchronous call owns its O(S) captured numeric rate records. They release on return or throw, and the fresh constant-size result retains no model, pose, rate map, callback, task or resource handle.
