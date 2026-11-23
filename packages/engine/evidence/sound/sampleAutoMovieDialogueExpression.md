# src/sound/sampleAutoMovieDialogueExpression.ts#sampleAutoMovieDialogueExpression

## @evidence contracts/development/implementation.md#principled-implementation

A nonnegative safe frame selects the first half-open containing range; active closed visemes map to intensity one, while rest/outside maps to neutral intensity zero under the joined ordering premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The sampler returns separate authored/mouth layers without merging expression fields or changing the actor; timeline construction belongs to the join owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Authored emotion is borrowed unchanged, and no interpolated mouth strength, actor guess or audible-arrival shift is introduced; repository actor application remains unwired.

## @evidence contracts/development/common.md#meaningful-documentation

Documents nonnegative film frames, arbitrary seek, borrowed authored identity and fresh mouth/result ownership; hand-built malformed timelines are not revalidated here.

## @evidence contracts/development/implementation.md#efficient-algorithms

R ranges require O(R) worst-case linear search and constant fresh output storage; the first matching range short-circuits traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared ranges are reused across independent frame queries, and no previous cursor or cached pose can alter a backward seek.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh wrapper/mouth pair, which retains the supplied authored expression reference until discarded; no scene, GPU or audio resource is retained.
