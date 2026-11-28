# src/schema/IAutoMovieHumanArmPoseSchema.ts#IAutoMovieHumanArmPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The alias names the girdle, shoulder, elbow, forearm, wrist and hand groups. It specifies the common angular reference and identifies where side comes from.

## @evidence contracts/development/design.md#principled-representation

The six optional child schemas carry their own clinical limits and keep distinct joints separate. The Human channel evaluator associates the inputs with the side's bones and can combine contributions during projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose reuses this single-arm shape in a bilateral pair. Child schemas carry each region's limit metadata. Body dimensions remain in arm identity.
