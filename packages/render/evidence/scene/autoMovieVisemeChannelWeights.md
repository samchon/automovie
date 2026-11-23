# src/scene/autoMovieVisemeChannelWeights.ts#autoMovieVisemeChannelWeights

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives every viseme's preset with its phonetic reason, the closed visemes, the summing rule with a worked case and the clamping.

## @evidence contracts/development/implementation.md#principled-implementation

A VRM or imported model carries five vowel presets; each viseme takes the preset nearest its mouth opening and lip rounding, and summing the presets' ARKit channels by weight reproduces a blend of mouth shapes on models without per-viseme targets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The preset channels come from `AUTOMOVIE_EXPRESSION_PRESET_CHANNELS`, the table `applyExpression` also reads, so the mouth layer and the lip-sync series use the same factors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rows are the ones #4054 names, extended to the consonants by articulation; no factor is introduced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: at most 15 visemes and four channels each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the weights.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns a fresh map and holds no resource.
