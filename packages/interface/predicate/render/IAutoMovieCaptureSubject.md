# src/render/IAutoMovieCaptureSubject.ts#IAutoMovieCaptureSubject

## @evidence contracts/development/common.md#meaningful-documentation

Describes the source clock and its available views, marks and named events.

## @evidence contracts/development/design.md#principled-representation

The subject carries admitted played occurrences separately from legacy caption instants. A reused source event can therefore retain each entry and its exact output time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subject provides canonical playback events. Viewers and capture share the existing event type instead of guessing cue meaning from label-only instants.

# src/render/IAutoMovieCaptureSubject.ts#IAutoMovieCaptureSubject.playedCues

## @evidence contracts/development/common.md#meaningful-documentation

Retains one canonical played event per occurrence, including exact output and source time.
