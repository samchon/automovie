# src/film/createShotContractSubjectReader.ts#createShotContractSubjectReader

## @evidence contracts/development/implementation.md#principled-implementation

Placement applies sampleClipSequence's per-channel authority through channelKey and folds the sampled pose root through foldRoot with identity root scale, matching engine kinematics and viewer placement. Node boxes share nodeSubjectExtent and nodeSubjectBox with camera framing. Cached values depend on their keys, artifact contents and fallback rig answers; validity requires the caller's documented stable-input premise during the synchronous grade, not merely that this reader avoids mutation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One factory owns the indexes, the caches and the placement rules, so the graders in `realizeShotContract` and `evaluateShotPredicate` receive one reader and hold no lookups of their own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No node, model, formation or landmark is special-cased; first-record indexing answers what a first-match `find` would, and an unresolvable reference throws for the grade to fail rather than being replaced by a default placement.

## @evidence contracts/development/common.md#meaningful-documentation

States what is indexed and the duplicate rule, what is cached and why each cache is valid, the ownership of `props`, and the reader's lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

Building the indexes is linear in nodes, models, formations, performances, motions and landmarks; afterwards every id lookup is a constant-time map read instead of a scan per predicate, subject and instant. The dominant per-query cost is sampling: one `sampleClipSequence` over every object-motion track per distinct instant, one `sampleMotion` per pose read, and one rest-geometry walk per distinct node subject.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares sampled object channels by exact shot-local second and geometry/member extents by node/formation id during one grade. The caller must keep artifact contents, world placements and fallback rig lookup answers unchanged; this scope has no live-edit invalidation, and a changed input requires a fresh reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns six index maps, sized by the compiled artifacts, and three caches grown by distinct grading instants, distinct required node subjects and distinct formation subjects, all named by the contract; nothing else is retained, and everything is released when `realizeShotContract` returns and drops the reader.
