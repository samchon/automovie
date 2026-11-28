# src/schema/IAutoMovieHumanWristPoseSchema.ts#IAutoMovieHumanWristPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes the two directions and the negative motion on each axis. Its forward reference is the resting wrist.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-70, 80] degrees and radial deviation to [-30, 20]. The Human table maps them to the hand bone's flexion and abduction axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The wrist owns the two authored angles here. Forearm rotation and individual finger motion use other records.
