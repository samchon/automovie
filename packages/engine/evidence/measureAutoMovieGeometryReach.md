# src/measureAutoMovieGeometryReach.ts#measureAutoMovieGeometryReach

## @evidence contracts/development/implementation.md#principled-implementation

Inverts node TRS then pose-root rigid placement to obtain a model-frame target, preserving nonuniform scale and rotated roots; each arm gap is max(0, shoulder distance minus both rest segment lengths), with 1e-6 degeneracy/reach tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The branch resolves the sampled actor and target once, while a private arm helper owns rest-chain lengths, reachPose and ROM reporting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An incomplete or near-zero-length arm is unmeasurable; both missing chains, missing skeleton and any near-zero node scale throw rather than guessing reach or dividing by zero.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes model-metre geometric gap from ROM feasibility, local time and named refusal conditions; a zero gap does not guarantee a ROM-valid pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Actor/selector lookup and up to two rest FK and reach/ROM solves dominate work, linear in rig bones; no time sweep or rendering is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both arms use the same resolved target and sampled spatial record; rest/IK results are not cached across mutable skeleton snapshots.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Resolved actor, target and solver poses are call-local; only scalar measurement fields escape, with no retained rig or external resource.
