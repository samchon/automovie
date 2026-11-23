# src/render/film/IAutoMovieProductionAudioAssetIdentityBase.ts#IAutoMovieProductionAudioAssetIdentityBase

## @evidence contracts/development/design.md#principled-representation

Sample count and rate carry integer clock facts, while durationSeconds equals their binary64 quotient rather than an exact rational value. The planner checks cue spans against sourceFrames using exact frame-to-sample conversion instead of deriving sample count from rounded seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields that do not depend on provenance live here once, and the union type adds only what each arm needs, so the two arms cannot describe the shared facts differently.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface encodes no default or special value; every constraint on its fields is enforced by `normalizeAudioAssets`, which the doc names.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the union that extends it and the validator with each refusal, and every member states its unit, source or derivation.
