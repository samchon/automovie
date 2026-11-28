# src/schema/IAutoMovieHumanVisemeWeightsSchema.ts#IAutoMovieHumanVisemeWeightsSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration documents the named signals, their speech shapes and one normalized weight per supplied signal.

## @evidence contracts/development/design.md#principled-representation

Each of the 15 optional weights has inclusive [0, 1] bounds. Generated admission imposes no sum requirement. The Render model consumer skips absent and unmapped entries and accumulates mapped channel contributions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mouth schema, dialogue samples and imported-model rendering reuse the Interface vocabulary. The Human alias adds per-weight metadata while the dialogue sampler and Render own their own blending rules.
