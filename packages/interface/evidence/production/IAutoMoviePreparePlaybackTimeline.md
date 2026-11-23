# src/production/IAutoMoviePreparePlaybackTimeline.ts#IAutoMoviePreparePlaybackTimeline.IResult

## @evidence contracts/development/design.md#principled-representation

Timeline entries and runtime are output-clock seconds; trim offsets remain shot-local seconds. Preparation assumes cutSequence admitted trim and transition durations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

preparePlaybackTimeline shares this result between sequenceTimeline and sequenceEventTimeline so frame/event consumers use the same edit layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The index is readonly only through its type and retains original shot objects; no duplicate ids or missing referenced shots are silently resolved.

## @evidence contracts/development/common.md#meaningful-documentation

Prepared output-clock layout and the supplied-shot identity index it uses. Timeline entries and runtime are output-clock seconds; trim offsets remain shot-local seconds. Preparation assumes cutSequence admitted trim and transition durations.
