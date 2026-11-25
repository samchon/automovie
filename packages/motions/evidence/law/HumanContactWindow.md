# src/law/HumanContactWindow.ts#HumanContactWindow.fromPath

## @evidence contracts/development/common.md#meaningful-documentation

States the port, its source lines, the velocity, threshold and filter, the toe point and its frame, how the law's intent is kept, the lock and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A port of orangeduck/Motion-Matching `resources/generate_database.py` at 346e8baa90e724b26c65ebfdf49729ebecb06b15 (MIT, "Copyright (c) 2021 Daniel Holden"), lines 135-176: the toe velocity by central difference at 60 samples a second with the source's end extrapolation, contact below 0.15 m/s, then `ndimage.median_filter(size=6, mode='nearest')` per toe, read as scipy computes it (rank `size // 2` over the window `size // 2` before to `(size - 1) // 2` after, edges repeated). The toe is the metatarsophalangeal joint (`Toes` bone origin), read in the support's frame (contacts.md, "Measure slip ... in its frame"). The law's declared bearing windows keep the intent (kind, support, region, load); the path times them. Each foot's contact is then locked as the same repository's controller locks it: `controller.cpp` `contact_update` (lock where a contact begins, let go where it ends or the animated toe leaves the lock by `ik_unlock_radius` 0.2 m) with `spring.h`'s `inertialize_transition`, `inertialize_update` and `decay_spring_damper_implicit` at `ik_blending_halflife` 0.1 s and `common.h`'s `fast_negexpf`, `LN2f` and the finite difference's `eps`, run at the step 1/60 s from `contact_reset`. The source projects the lock onto its ground at its foot height (`contact_point.y = foot_height`); the lock is projected onto the plan's floor beneath it (`IPath.floor`) the same way, and keeps the toe's height only where the plan gives no floor. The shown contact is then held at least at the floor beneath it, the source's `contact_position_clamp.y = maxf(contact_position_clamp.y, ik_foot_height)` over the plan's supports (`IPath.floor`: the support's height there plus the toe joint's height above its sole), the lock's own state left unclamped as in the source.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample both toes once, then per foot: velocities, threshold and filter into contact states, the states into runs matched to the first declared window each overlaps, and the states through the controller's lock into offsets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No height test, as the source has none; a foot the law never declares bearing gets no window, however still; a plan shorter than the four samples the end extrapolation reads throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Once per plan, at preparation: one toe read per sample, linear in the samples per foot, the filter a constant window.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both feet read from one sample of the plan's posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the samples until it returns; the windows and one offset per sample and foot escape.

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

# src/law/HumanContactWindow.ts#HumanContactWindow.IPath.floor

## @evidence contracts/development/common.md#meaningful-documentation

States the foot and point it takes, the least toe-joint height it returns, its unit and frame, and what its absence means.

## @evidence contracts/development/implementation.md#principled-implementation

The source's IK floor clamp (orangeduck/Motion-Matching controller.cpp, MIT: contact_position_clamp.y = maxf(contact_position_clamp.y, ik_foot_height)) over the plan's own supports: the support's height beneath the point plus the toe joint's height above its sole, where the source has one flat ground and one foot height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One height per point, the law's own support model.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The law's own supports and body measure, no constant of the source's character.

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

# src/law/HumanContactWindow.ts#HumanContactWindow.locked

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, by what, its source and the legs left alone.

## @evidence contracts/development/implementation.md#principled-implementation

The source's controller moves the heel's IK target by the locked contact's offset from the animated toe (`controller.cpp`, the two-bone IK on `contact_position_clamp + (heel - toe)`); here the leg goal's end point and bend move by the same offset, read linearly between the samples `fromPath` locked.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset read and one goal shift per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg with no world goal is left as the law gives it, not refitted. The source's clamp of the IK target above its floor (`contact_position_clamp.y` at least `ik_foot_height`) is applied by `fromPath` over the floor the plan gives (`IPath.floor`), so a locked foot is never shown through its support.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per read: two table entries and a lerp per foot.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the table `fromPath` prepared once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture sharing the law's unchanged members; retains nothing.

# src/law/HumanContactWindow.ts#HumanContactWindow.IContacts

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and frame.

## @evidence contracts/development/design.md#principled-representation

The plan's windows and the controller's lock offsets per foot and sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: what the audits read and what the posture reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Offsets at the sample rate, not a reader closure, so the posture reads a prepared table.