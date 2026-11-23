# src/lexicon/HumanMountPush.ts#HumanMountPush.IRoll

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The goal the limb fit takes, and the two readings that decide when the foot leaves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanMountOn` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The roll is the toes' extension by construction, so the two cannot disagree.

# src/lexicon/HumanMountPush.ts#HumanMountPush.IBend

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit and sign.

## @evidence contracts/development/design.md#principled-representation

The verdicts' own reading, and the axis a foot turns about to change it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read in this namespace only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The axis is signed off the foot itself, so a turn about it cannot flip as the leg swings.

# src/lexicon/HumanMountPush.ts#HumanMountPush.bend

## @evidence contracts/development/common.md#meaningful-documentation

States the closed form, the inputs and the degenerate case.

## @evidence contracts/development/implementation.md#principled-implementation

The pole-vector two-link solution, the same plane the limb fit bends the knee in, and the clinical sagittal angle the verdicts read.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg past its reach is read straight, at its span's bound; stated here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.roll

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The heel rises about the ball, the joint a push-off rolls over, by the turn that leaves the ankle exactly at `DORSAL` once the knee follows (`pitch`), in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The flat foot's bend, then one turn where it is past `DORSAL`.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the ankle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.pole

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The knee points where the thigh's front faces, the sagittal right angle off the leg, so the pole never degenerates when the foot passes behind the hip.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.tip

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The turn about the ball keeps the ball where a rest's tread takes it and leaves the ankle bent by exactly the share of the excess asked once the knee follows (`pitch`), in closed form.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the ankle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.twist

## @evidence contracts/development/common.md#meaningful-documentation

States what the turn is, why it decides the knee and the degenerate cases.

## @evidence contracts/development/implementation.md#principled-implementation

An ankle with an immobile axial axis meets a foot rotation only at the swivel whose bend plane holds the ankle's flexion axis parallel to the knee's hinge (Tolani, Goswami and Badler 2000, section 3.2.4, a joint limit as a function of the swivel); the pole-vector knee gives that hinge in closed form.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The knee is `bend`'s.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.squared

## @evidence contracts/development/common.md#meaningful-documentation

States the turn applied and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

One rotation about the shank through the ankle: the ankle and the pole stay, and the foot's turn out of the knee's plane becomes the asked one exactly.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `twist`, the one reading of the turn.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountPush.ts#HumanMountPush.knee

## @evidence contracts/development/common.md#meaningful-documentation

States the knee, its inputs and the degenerate case.

## @evidence contracts/development/implementation.md#principled-implementation

The pole-vector two-link solution, the plane the limb fit bends the knee in.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the body's own measures.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The knee `bend`, `twist` and `pitch` read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
