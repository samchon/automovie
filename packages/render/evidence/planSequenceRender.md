# src/planSequenceRender.ts#planSequenceRender

## @evidence contracts/development/implementation.md#principled-implementation

preparePlaybackTimeline owns trim, playback-rate and overlap arithmetic, and editorial markers use the prepared layout and shot index; frameTimes supplies increasing half-open output samples, and one playbackCursor resolves those samples without changing the sequence's editorial fps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The manifest gathers timeline spans, resolved frame samples and paths so a capture host reads one plan instead of independently implementing the cut.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A mismatched render target or empty schedule refuses; output path overrides are caller data and no sequence identity is specially recognized.

## @evidence contracts/development/common.md#meaningful-documentation

The planner documents editorial versus output fps and target equality; manifest members state seconds, trim offsets, each blend's progress and kind, and host paths.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S supplied shots, E timeline entries, F output frames, M marker visits across plays and K retained placements, planning takes O(S+E+F+M+K log K) time and O(S+E+F+K) peak metadata space. One forward cursor avoids a full timeline scan per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prepared layout and index feed editorial marker placement, shot spans, transitions and every frame sample; the forward cursor retains its current entry across increasing sample times only within this call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan retains shot spans, frame metadata proportional to the output schedule, and retained editorial marker placements; the temporary cursor and timeline are released on return, and planning opens no host resource.
