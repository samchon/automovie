# src/handling/putDownWrist.ts#putDownWrist
## @evidence contracts/development/common.md#meaningful-documentation

States the offset it reads, the three destinations and how each lays the wrist, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The grip's offset is the prop's displayed frame in the hand's displayed frame at the start, so the same grasp lays the prop down: the wrist is the destination frame times the inverse offset. A declared attitude takes the asked heading, or the heading nearest it the arm meets (`AutoMovieMotionHumanArmReach.attitude`, about the vertical); a bone or socket destination (`putDownTarget.of`) is laid on its frame; a free placement keeps its authored heading or takes the first of `putDown.HEADINGS` the arm reaches (`HumanGrasp.reachable`, nearest the prop's own heading first).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `putDown.plan` as the placing wrist; the plan then times the transport, the release and the return to it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A put down that names no destination is refused; a heading the arm cannot meet is refused by the reach owner, never nudged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two displayed-frame reads; a free placement tries at most the 24 headings against the arm's reach.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan; the plan keeps the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/putDownWrist.ts#putDownWrist.IWrist

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The displayed hand, the grip's offset in the hand's frame, the elbow's world hint, the authored destination kind and attitude, and the placing wrist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `putDownWrist.of` to `putDown.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional destination kinds and attitude are the parameters' own; absent means not authored.
