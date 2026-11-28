# src/schema/IAutoMovieHumanForearmPoseSchema.ts#IAutoMovieHumanForearmPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation specifies the neutral position, signed rotation and degrees. It distinguishes pronation and supination as directions of one field.

## @evidence contracts/development/design.md#principled-representation

Typia bounds pronation to [-87.8, 79.45] degrees. The Human channel table maps it to lower-arm twist, and rig evaluation owns how the turn is shared with the wrist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arm pose carries one axial forearm field. Wrist flexion and deviation use their own record.
