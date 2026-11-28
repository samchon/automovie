# src/schema/IAutoMovieHumanElbowPoseSchema.ts#IAutoMovieHumanElbowPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies the hinge, straight reference and flexion sign. Its negative interval is explicit.

## @evidence contracts/development/design.md#principled-representation

The optional angle admits [-2.75, 147.3] degrees. The Human channel table maps it to lower-arm flexion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arm pose uses only one elbow hinge input here. Forearm axial rotation stays with its own record.
