# src/film/resolvedPerformShotPoint.ts#resolvedPerformShotPoint

## @evidence contracts/development/implementation.md#principled-implementation

Repeats the gate's live-resolver then staged-lookup precedence at time zero. Its asserted non-null result relies on unchanged tables and a consistent live resolver; an arbitrary stateful callback is not made stable by the earlier gate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One post-gate read shared by the focus intent and the subject framer, replacing two inline copies of the precedence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No default point is substituted; the caller must preserve the earlier resolution premise because this helper does not revalidate a stateful callback or repair a missing answer.

## @evidence contracts/development/common.md#meaningful-documentation

States the precedence, the instant, the precondition that makes the result total, and both readers.

## @evidence contracts/development/implementation.md#efficient-algorithms

One live query or one table lookup, plus a group's member mean when the target is a group.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One read per call; the tables it reads are the shared context's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned point may be a staged vector the caller only reads.
