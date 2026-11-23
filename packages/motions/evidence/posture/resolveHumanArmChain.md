# src/posture/resolveHumanArmChain.ts#resolveHumanArmChain

## @evidence contracts/development/common.md#meaningful-documentation

States current-coordinate FK, local-reader provenance, world-frame inputs, completed-shoulder provenance and fresh observation-free outputs.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the original upper/forearm/hand quaternion/rest-offset expression grouping and call order; the shoulder position is copied from completed actual same-frame FK when supplied, otherwise its original parent-offset expression runs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One FK body accepts the existing pure local articulation readers, so cold and derivative paths share all hierarchy mathematics while probe attachment remains separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rest scale stays unused as before, each world prefix is recomputed and supplied completed shoulder data requires unchanged parent/rest dependencies; reader inputs are current clinical coordinates rather than a fitted world result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed three-joint world FK and three ordered local queries remain without tip/probe allocation. A prepared scalar reader avoids two input tuples on local hits; cold calls keep their original tuples. An available same-frame shoulder point replaces its parent-offset math with a fresh copy; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares only actual invariant local-reader work and completed same-frame shoulder data; changing parent or coordinates still changes the corresponding world computation on every call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no callback, input or result; the caller owns the fresh fixed-size chain record and its six world vectors/quaternions.
