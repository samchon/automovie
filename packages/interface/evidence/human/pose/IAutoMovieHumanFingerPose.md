# src/human/pose/IAutoMovieHumanFingerPose.ts#IAutoMovieHumanFingerPose

## @evidence contracts/development/common.md#meaningful-documentation

One finger's joints proximal to distal, degrees.

## @evidence contracts/development/design.md#principled-representation `mcpFlexion`: Metacarpophalangeal flexion, 0 to 80. `mcpAbduction`: Metacarpophalangeal abduction away from the middle finger (the middle finger: toward the thumb), 20 each way (convention). `pipFlexion`: Proximal interphalangeal flexion, 0 to 90.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFingerPose is the canonical exchange used by IAutoMovieHumanFingerPoseSchema, IAutoMovieHumanHandPose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `mcpFlexion`: Metacarpophalangeal flexion, 0 to 80. `mcpAbduction`: Metacarpophalangeal abduction away from the middle finger (the middle finger: toward the thumb), 20 each way (convention). `pipFlexion`: Proximal interphalangeal flexion, 0 to 90. `dipFlexion`: Distal interphalangeal flexion, 0 to 65.
