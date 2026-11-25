# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the result's axes and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The carrier's own moving reading of the contact, or its frame composed with the contact's model frame where the carrier publishes no moving reading, then turned by the inverse of the contact's model rotation so the axes are the model's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the contact, then one composition per read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing contact is refused with the carrier's contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

One contact lookup per plan and one carrier read per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is a different second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the carrier and the contact's model rotation for the plan's life.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.contact

## @evidence contracts/development/common.md#meaningful-documentation

States both readings.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A read or one rigid transform.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller admits the contact first; nothing is guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One carrier reading and at most one contact lookup.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.held

## @evidence contracts/development/common.md#meaningful-documentation

States the test and its bound.

## @evidence contracts/development/implementation.md#principled-implementation

The arm goal's wrist against the contact's world point; a hand's length covers the wrist's offset from the grip.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One check per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal attached to a bone is not read as holding.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new set.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.surge

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and why the window is a stride.

## @evidence contracts/development/implementation.md#principled-implementation

The central second difference of the frame's position a stride either side, which cancels any motion periodic in the stride exactly, projected on the level forward.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window is the author's stride or a named provisional one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two more frame readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.move

## @evidence contracts/development/common.md#meaningful-documentation

States what moves and how the heading branch is kept.

## @evidence contracts/development/implementation.md#principled-implementation `carryHumanPosture` for the points and goals, and the attitude read back from the turn composed with the posture's own rotation, as the ride tips a seated pelvis with its support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One carry, one composed rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Goals attached to a bone are left to their bone, as the carry does.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per limb.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `carryHumanPosture` and `resolveHumanPosture`'s attitude conversions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.coursed

## @evidence contracts/development/common.md#meaningful-documentation

States the frames and why.

## @evidence contracts/development/implementation.md#principled-implementation `move` into the contact's frame at each second before the course reads the plan, and out of it after.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

Two wraps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course is the caller's own; only its frame changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two frame reads per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure wrap.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan and the reader.

# src/lexicon/HumanMountedFrame.ts#HumanMountedFrame.partnerHold

## @evidence contracts/development/common.md#meaningful-documentation

States the place and its one degenerate case.

## @evidence contracts/development/implementation.md#principled-implementation

The partner's displayed joint pushed out level from the hips by the limb's radius and the palm's thickness, so the site lies on the surface a palm closes on, not inside the body.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One read and one offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone straight over the hips keeps its joint, having no level way out.

## @evidence contracts/development/implementation.md#efficient-algorithms

One read of two bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read per instant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
