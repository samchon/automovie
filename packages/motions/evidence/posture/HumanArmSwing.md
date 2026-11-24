# src/posture/HumanArmSwing.ts#HumanArmSwing.precision

## @evidence contracts/development/common.md#meaningful-documentation

States the tolerance and its owner, its unit, the lever and its source, the conversion and the resulting precision on one body.

## @evidence contracts/development/implementation.md#principled-implementation

A turn of the shoulder by an angle moves a point at a lever along an arc of the lever times the angle, which bounds its chord.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quotient.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The length is the audit's own limit and the lever the body's own measure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the audit's limit and the body's measure.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmSwing.ts#HumanArmSwing

## @evidence contracts/development/common.md#meaningful-documentation

States which arms, against what allowance and what is written back.

## @evidence contracts/development/implementation.md#principled-implementation

A hanging arm's fingers lie against the thigh in the quiet stance, which the tangle audit takes as its baseline; the swing may come that near and no nearer, the same rule the audit reads. An arm that entered lying deeper, on a contact the action before left, may stay as deep as it entered and no deeper, so the action starts on the arm it was handed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve and one ordered current-joint scan per free arm precede its bisection in the pose earlier arms produced; the same continuous room crossing determines least abduction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arm with a hand goal is the fit's to clear and is left alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Keeps all current arm fits, clearance and bisection readings and fresh outputs. In a call that needs both quiet-stance allowances, both read the same stance fit and collider placement. When all needed allowances already exist, it prepares no quiet stance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Complete seeded pose and stance fits may borrow one same-operation FK workspace and genuine ROM projector. Each candidate remains fully admitted. A quiet-stance allowance reads the bones and shapes of the same unchanged modeled stance on either side.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The existing weak stance map retains two scalars per body/arm only. Local/parent FK and ROM loans end with the synchronous operation; neither returned posture nor stance cache stores a reader, projector, current pose or callback.

# src/posture/HumanArmSwing.ts#HumanArmSwing.Entered

## @evidence contracts/development/common.md#meaningful-documentation

States what each side's entry holds and who reads it.

## @evidence contracts/development/design.md#principled-representation

One clearance baseline per side, the same record the clearance owner measures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A partial map by side; an absent side lies as the quiet stance allows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No depth is invented: an entry room is a measured baseline or absent.

# src/posture/HumanArmSwing.ts#HumanArmSwing.carriage

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, over what, why it is held, and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each sample's least clearing abduction is `of`'s own; the carriage is the greatest of them, so every sample is clear by the same measure and the take's arms move only as the gait writes them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Accumulate the maximum while preserving earlier-arm geometry. A last-arm search may end at its first certified upper bound below that maximum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arm with a hand goal in a sample is the fit's and adds nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluate every requested posture, then only native room candidates that can change its maximum or affect another arm. An already dominated bisection omits the rest of its candidate evaluations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every actual phase callback and of call receives one operation-local/borrowed FK source and genuine ROM projector. The native full fits and room/bisection observations still run; only fixed ROM indexing and exact checked FK work are shared across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous carriage owns its getter and at most one genuine projector, first demanded after an actual posture callback, until return/throw. Only two numeric abductions escape; no current posture, workspace or callback is retained.

# src/posture/HumanArmSwing.ts#HumanArmSwing.carry

## @evidence contracts/development/common.md#meaningful-documentation

States what is raised and which arms are left.

## @evidence contracts/development/implementation.md#principled-implementation

The carriage is an abduction added to the gait's own angles, so the swing it rides is unchanged.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One map over two arms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arm with a hand goal is left alone.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
