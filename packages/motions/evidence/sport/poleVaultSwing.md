# src/sport/poleVaultSwing.ts#poleVaultSwing.of

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
# src/sport/poleVaultSwing.ts#poleVaultSwing.integrate

## @evidence contracts/development/common.md#meaningful-documentation

States the loop, its end and its three failures.

## @evidence contracts/development/implementation.md#principled-implementation

Linthorne 2000's flexible-pole model: Eq. 3 capped by Eq. 1 at the plant, Eq. 2 along the chord while bent, 0.01 s uniformly accelerated steps, release at recoil to the pole's length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop that states how it ended.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failure is returned as its reason, never thrown or truncated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass at the model's step.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Prepared once per swing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns its samples; retains nothing.

# src/sport/poleVaultSwing.ts#poleVaultSwing.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

States its two axes.

## @evidence contracts/development/design.md#principled-representation

A vector in the vault's plane, as the model reads it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two numbers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Named axes, not an index.

# src/sport/poleVaultSwing.ts#poleVaultSwing.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The model's inputs: the plant's state, the mass and the pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the model reads and the refusal's speed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default; the caller states each.

# src/sport/poleVaultSwing.ts#poleVaultSwing.ISample

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

One integrated instant: time, position, velocity and the interval's acceleration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The state the next interval reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The acceleration is the interval's own, so a reading is the model's.

# src/sport/poleVaultSwing.ts#poleVaultSwing.IOutcome

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The samples, the pole's length and the failure as explicit state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the swing and the grip search read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failure is a reason string or null, not an exception.

# src/sport/poleVaultSwing.ts#poleVaultSwing.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The reached swing and its reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The samples, the duration, the length and the reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader is the model's interval motion, not an interpolation of ours.

# src/sport/poleVaultSwing.ts#poleVaultSwing.ISwing.at

## @evidence contracts/development/common.md#meaningful-documentation

States the second it takes and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The interval's uniformly accelerated motion from its start, the model's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Clamped to the swing's samples; no extrapolation beyond them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared samples.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh sample.
