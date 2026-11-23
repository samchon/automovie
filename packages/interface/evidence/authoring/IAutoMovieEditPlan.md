# src/authoring/IAutoMovieEditPlan.ts#IAutoMovieEditPlan

## @evidence contracts/development/design.md#principled-representation `cutSequence` checks the plan as editorial arithmetic: a non-blank sequence id, a finite positive frame rate, at least one entry, and each entry's trim and transition bounds; the runtime is the sum of played spans minus each accepted transition's overlap. Requirements address a zero-based entry and an exact event id or an active prop channel on the output timeline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plan is the sequence identity, frame rate, ordered entries plus optional event and prop-channel requirements and two rationale fields. Symbolic trims reuse the built shot events and lower to numeric spans. Requirements and rationale belong to assembly only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Pacing and continuity are declared unchecked prose instead of being given a heuristic score, and the display name is passed through without a check that would only test formatting. An event surviving another play cannot satisfy a requirement and multiple matching events in the addressed play are refused. A prop check reads two played boundary values and refuses missing or ambiguous samples.

## @evidence contracts/development/common.md#meaningful-documentation

States which function consumes the plan, which fields are checked and how, the frame-rate unit, that order is playback order, how requirements address a play or hard cut and that the prose fields are never read.
