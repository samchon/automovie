# src/striking/KickContact.ts#KickContact.choose

## @evidence contracts/development/common.md#meaningful-documentation

States canonical carriage/chain inputs, optional fixed step and preferred lean, the physically fitted winning contact and the unsettled step's refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the original ordered lean search and the solved step correction, iterated as a fixed point until the step settles within the limb solver's tolerance, with full physical leg fits, first valid contact and strict best residual selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The local candidate builder shares only its same-base hip and fixed rig metadata; the outer lean/step loops still own every numerical trial and stopping condition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every original lean, step bound, plant, ROM clamp, arm/rival fallback and miss remains. The positive-zero initial trial reuses only its actually computed identical base/hip/solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original bounded lean/step/refit search remains; one lazy prepared chain shares genuine ROM, endpoint demand, bend, extension bound and push rotation metadata across all actual trials, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The synchronous search keeps one canonical body and rig unchanged. Only its issued ROM metadata and exact FK prerequisites are borrowed; changed carriage/goal candidates always run their full physical fits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

FK workspaces, the lazy fixed-chain producer and its ROM projector end on this call's return or throw; that same scoped mapper serves each existing carriage-tilt/hip clamp, without changing raw lowering. The returned contact contains only its original carriage, posture and fitted numerical observations; no helper, projector or new history escapes.
