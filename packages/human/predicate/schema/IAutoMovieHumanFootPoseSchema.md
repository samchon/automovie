# src/schema/IAutoMovieHumanFootPoseSchema.ts#IAutoMovieHumanFootPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description locates the two foot angles and makes clear that the hallux and each of the four lesser toes can be authored separately.

## @evidence contracts/development/design.md#principled-representation

Typia bounds subtalar inversion to [-5, 5] degrees and midfoot supination to [-15, 35]. The Human table maps them with its established abduction signs. Each supplied toe uses its corresponding child schema.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leg pose uses this optional record for the foot beyond the ankle. Hallux motion has its own shape, and the lesser toes reuse one schema.
