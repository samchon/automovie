# src/kinematics/swingTwistRefusedArcs.ts#swingTwistRefusedArcs

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, which limits refuse which arcs, the result's form and every case that refuses nothing.

## @evidence contracts/development/implementation.md#principled-implementation

The twist's half-angle product and the swing's rest-direction cosine are exact sinusoids of the swivel (Tolani, Goswami and Badler 2000, section 3.2.3), so each limit refuses the arc between one sinusoid's two roots, kept a margin inside the range so every refusal is certain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three rotations sampled, two sinusoids fitted, their arcs merged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closed-form roots, never sampling; a frame other than the range's own refuses nothing rather than guessing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations and two arcs a call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Moved from `swingTwistExcludedSwivels`, whose test and `hingedSwivelFeasible` read the same arcs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.