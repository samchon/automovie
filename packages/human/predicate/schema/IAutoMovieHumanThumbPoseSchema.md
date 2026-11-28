# src/schema/IAutoMovieHumanThumbPoseSchema.ts#IAutoMovieHumanThumbPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names five channels and their joints, including opposition that turns the thumb pad toward the fingers.

## @evidence contracts/development/design.md#principled-representation

Typia uses [-20, 15] degrees for carpometacarpal flexion, [0, 60] for palmar abduction, [0, 45] for opposition, [0, 50] for MCP flexion and [0, 80] for IP flexion. Human maps them to the thumb's metacarpal, proximal and distal bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hand schema reuses this optional record only for the thumb. Its carpometacarpal motions need their own fields because the other fingers use different joint records.
