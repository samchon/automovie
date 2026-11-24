# src/sport/poleVaultSwing.ts#poleVaultSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the model and its source, each equation, the integration step and rule, the release and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Linthorne 2000 (Sports Engineering 3:205-218), "Flexible-pole model": the vaulter a point mass on the end of a massless pole, the pole's length the upper grip's height; the plant loses Eq. 3's `F0^2 / (2k) cos^2(phi + alpha)`, capped by Eq. 1's rigid loss, with `k` 250 N/m; the pole pushes along its chord with Eq. 2's `F0 + 0.6 F0 (L0 - L) / L0` while bent; the motion is integrated at 0.01 s, each interval uniformly accelerated; the vaulter lets go when the pole has recoiled to its length. `F0` per kilogram of rating is Fuchimoto, Ito and Kaneko 1991's 800 N at 80 kg, as Linthorne reads it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function `integrate` runs the one loop and states how it ended; the function throws a failed outcome as a refusal and reads a reached one by its intervals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A swing that does not reach the release is a failure the caller reads or a refusal, never a truncated swing; no step size or force is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass at the model's step from the plant to the release; a reading is one interval's closed form.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The integration is prepared once per swing and read in place.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the samples it integrated, one per 0.01 s of the swing, for its reader.
