# src/sampleFormationSlotMotion.ts#sampleFormationSlotMotion

## @evidence contracts/development/implementation.md#principled-implementation

A deterministic start/id cue walk eases numeric offset and heading while present stays discrete until cue end, preserving authored removal and recovery states between cues.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Geometry measurement, placement validation and viewer exceptions share the slot state while formation-wide motion stays in its own sampler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No half-present state is invented; the discrete boundary rule and first-active precedence apply to every named slot without member-specific defaults.

## @evidence contracts/development/common.md#meaningful-documentation

States presence boundaries, exact target retention, full cue/slot-list selection cost and shared identity/input ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

M supplied cues and L slot entries inspected by includes require O(M+L) selection, followed by O(C log C) sorting and O(C) walking C matches, plus compared id-string lengths; temporary storage is O(C).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A different slot or source chronology changes the selected cues, and no cross-query exception index is retained here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Active numeric records are new, but identity and retained states alias shared records; the selection array is temporary and no actor object is retained.
