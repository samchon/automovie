# src/film/cutSequence.ts#cutSequence

## @evidence contracts/development/implementation.md#principled-implementation

The edit clock follows [OpenTimelineIO time ranges](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/time-ranges.md#markers), with source instants placed in a parent timeline. The [OpenTimelineIO linear time warp](https://opentimelineio.readthedocs.io/en/latest/tutorials/otio-serialized-schema.html#LinearTimeWarp-1) uses the same constant source-time scale per output second. One ordered pass carries the previous entry's played span and incoming transition, which is all an OpenTimelineIO-style end-to-end track needs to check overlaps and accumulate runtime; a later check is skipped when an earlier fault leaves its operand undefined, such as an unknown shot or an invalid trim, so one cause is not reported twice. After layout admission, the number of projected matches for each entry and event address must be one and each declared prop channel must agree within its tolerance at its hard cut.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates and assembles in one function because every check reads the same running timeline state. Shared artifact gates check requirement shapes and event ids. Event requirements reuse `sequenceEventTimeline` and prop comparisons delegate to checkCutPropContinuity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no shot or fixture, and refuses out-of-range source events, numeric trims and transitions. A symbolic span whose reconstruction would overshoot its admitted end uses the immediately preceding positive binary64 duration.

## @evidence contracts/development/common.md#meaningful-documentation

States every gate with its bound, which transitions are compared with which played spans, the runtime formula and unit, and what the sequence copies or shares.

## @evidence contracts/development/implementation.md#efficient-algorithms

Layout takes linear time in shots plus entries and the events of symbolically trimmed shots, indexed once per shot. When event requirements exist, one event projection and sort are followed by one pass to index placed events and one constant-time lookup per event requirement. Prop requirements use one clip sample per addressed entry side plus per-channel comparisons.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All required events share one playback projection and one per-entry count index. Prop checks share the samples at each addressed entry side within the cut.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The source event indexes, projected events, count index and prop samples are local to assembly. The result owns a new sequence and entry list or a violation list bounded by the input shots, entries and requirements.
