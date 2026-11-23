# src/index.ts#prepareRecoveryMapJointBlocks

## @evidence contracts/development/implementation.md#principled-implementation

Original positive column norms and undamped point SVDs precede point-first Givens elimination. Step and metric consumers use identical row order, global camera/point scales and damping coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared preparation exposes an admitted elimination action and optional scaled-gradient measurement; full LS solving and rank-only metric consumption remain separate operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rank is inferred from damping, no row is dropped, and an unrequested gradient is explicitly null rather than false stationarity.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are borrowed numeric blocks; original step consumers request the unchanged gradient loops while metric consumers skip them. The action accepts only finite nonnegative caller-admitted damping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Original scale/point-rank work costs O(E*C+S*E); each point elimination costs O((E+L)*C). Original entry bounds precede numerical allocation, and the caller retains its conservative full-model charge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One set of current global scales and original point qualifications serves both zero and damped eliminations without a second derivative pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned O(C+L) scales and a closure borrowing current blocks live for one operation. Original/damped arrays remain under the existing model reserve; only explicitly selected metric factors transfer, never this preparation or its closure.
