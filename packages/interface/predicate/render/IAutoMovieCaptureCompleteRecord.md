# src/render/IAutoMovieCaptureCompleteRecord.ts#IAutoMovieCaptureCompleteRecord

## @evidence contracts/development/common.md#meaningful-documentation

Documents the selected played occurrence and retained video presentation evidence in a complete record.

## @evidence contracts/development/design.md#principled-representation

A drawn cue retains the resolved source and output identity, while a file capture may retain its exact decoder clock. Optional fields keep earlier record shapes readable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The completed record retains one resolved source occurrence when selected and delegates encoded media presentation to the video source receipt.

# src/render/IAutoMovieCaptureCompleteRecord.ts#IAutoMovieCaptureCompleteRecord.playedCue

## @evidence contracts/development/common.md#meaningful-documentation

Keeps source shot, played entry and exact event time after the stills are written.
