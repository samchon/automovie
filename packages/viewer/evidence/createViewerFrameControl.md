# src/createViewerFrameControl.ts#createViewerFrameControl

## @evidence contracts/development/implementation.md#principled-implementation

Transfers the existing native camera snapshot and finite nonnegative completed seconds, then rebases and redraws through the original producer. Failed redraw independently restores the previous borrowed camera and mount base, preserving the source refusal before rollback causes; application graph/pixel rollback remains source-owned. Reference-counted freeze leases suppress producer ticks and pair the outermost producer pause with one final release, distinguishing resume from terminal disposal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the actual controller used by mountViewer without creating a renderer or a second clock. Camera transfer stays with createViewerCameraState, and source clocks/audio remain behind an explicit producer lease.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No timer, foreign method or synthetic completed frame is substituted. Invalid state refuses before camera mutation; a failed release preserves its cause and refuses further playback until terminal cleanup.

## @evidence contracts/development/common.md#meaningful-documentation

States nested ownership, explicit-draw behavior, terminal versus resumable release, borrowed camera scope and independent source-state responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Tick gating and lease accounting use constant work/storage; camera snapshots use the existing fixed-size native adapter and producer operations retain their own cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nested freezes share one outer producer lease; every returned release and terminal cleanup has one sticky attempt. Distinct redraws remain real producer effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one borrowed camera, callbacks, scalar lease count and at most one producer release. Final release or dispose consumes that release once; disposed controllers reject later effects and acquired producer resources remain governed by the producer's release callback.
