# src/film/evaluateShotPredicate.ts#evaluateShotPredicate

## @evidence contracts/development/implementation.md#principled-implementation

Each kind is measured directly from the reader's placements and poses, the distance with `Math.hypot`, and the comparison widens the declared value by the declared tolerance on the side the operator constrains; a bone the rig does not declare is refused before sampling, because a pose with no entry for a joint means rest only for a joint the rig has.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function per predicate is what the opening, closing and event grades of `realizeShotContract` share, and the reader supplies every lookup, so the measurement holds no index or props of its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor, bone, axis or selector is special-cased; every measurement exception becomes a failing null result. The broad catch does not classify exceptions, so an unexpected sampling defect is indistinguishable from a documented missing-reference refusal in this output, a diagnostic limitation rather than evidence that only expected failures were caught.

## @evidence contracts/development/common.md#meaningful-documentation

States each measurement's unit, operator tolerance, null failure for unresolved references and the broader exception-to-null behavior whose output cannot recover the underlying cause.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local joint-angle work scans rig bones and sampled pose joints; position and distance read at most two placements. The reader's pose, spatial and rig operations add their own delegated cost, which this wrapper does not bound.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Measures one predicate per call; the supplied reader caches object-channel samples and model extents within the grading call, while poseAt samples motion again for each pose read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned result references the caller's predicate and holds one number.
