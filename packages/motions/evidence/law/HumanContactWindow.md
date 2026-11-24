# src/law/HumanContactWindow.ts#HumanContactWindow.fromPath

## @evidence contracts/development/common.md#meaningful-documentation

States the port, its source lines, the velocity, threshold and filter, the toe point and its frame, how the law's intent is kept and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A port of orangeduck/Motion-Matching `resources/generate_database.py` at 346e8baa90e724b26c65ebfdf49729ebecb06b15 (MIT, "Copyright (c) 2021 Daniel Holden"), lines 135-176: the toe velocity by central difference at 60 samples a second with the source's end extrapolation, contact below 0.15 m/s, then `ndimage.median_filter(size=6, mode='nearest')` per toe, read as scipy computes it (rank `size // 2` over the window `size // 2` before to `(size - 1) // 2` after, edges repeated). The toe is the metatarsophalangeal joint (`Toes` bone origin), read in the support's frame (contacts.md, "Measure slip ... in its frame"). The law's declared bearing windows keep the intent (kind, support, region, load); the path times them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample both toes once, then per foot: velocities, threshold, filter, runs, and each run matched to the first declared window it overlaps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No height test, as the source has none; a foot the law never declares bearing gets no window, however still; a plan shorter than the four samples the end extrapolation reads throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Once per plan, at preparation: one toe read per sample, linear in the samples per foot, the filter a constant window.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both feet read from one sample of the plan's posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the samples until it returns; only the windows escape.

# src/law/HumanContactWindow.ts#HumanContactWindow.Foot

## @evidence contracts/development/common.md#meaningful-documentation

States which parts a path times.

## @evidence contracts/development/design.md#principled-representation

The source's two toe joints, as the feet's contact parts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two values of the contact part union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Feet only, as the source; hands and knees stay declared.

# src/law/HumanContactWindow.ts#HumanContactWindow.IPath

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and frame.

## @evidence contracts/development/design.md#principled-representation

The law's declared windows, the plan's length and the toe path the port reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by `fromPath`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The toes are read in the support's frame by the caller, which owns the support.

# src/law/HumanContactWindow.ts#HumanContactWindow.IPath.toes

## @evidence contracts/development/common.md#meaningful-documentation

States the second it takes and the points it returns, their unit and frame.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's displayed toe joints, the source's contact bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of both toes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read on the displayed posture, never on a stand-in.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each caller's own read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each caller's own.

# src/law/HumanContactWindow.ts#HumanContactWindow.Toes

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and its unit.

## @evidence contracts/development/design.md#principled-representation

Both toe joints at one sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One point per foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keyed by the contact part, so no side is renamed.

# src/law/HumanContactWindow.ts#HumanContactWindow.IRun

## @evidence contracts/development/common.md#meaningful-documentation

Each member states which sample it is.

## @evidence contracts/development/design.md#principled-representation

A run of the filtered contact samples, inclusive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its first and last sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Samples, not seconds, so no rounding enters before the window is written.
