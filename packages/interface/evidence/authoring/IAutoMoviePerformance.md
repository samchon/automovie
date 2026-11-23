# src/authoring/IAutoMoviePerformance.ts#IAutoMoviePerformance

## @evidence contracts/development/design.md#principled-representation

performShot admits beat, duration and the selected final-or-draft action spans before compilation, then checks each emitted actor motion with validateMotion when the runtime resolves a skeleton. Supplied blocking adds beat/duration and anchor/camera coherence; a custom synthesizer can return null, so action admission alone does not certify every intended motion was emitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Draft, review and correction sit in one record so the self-review stays auditable beside what it changed, while only the selected list reaches the compiler, which keeps one action vocabulary for both rounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The draft is not merged with the correction or used as a fallback when `final` fails, and the prose fields are declared unread instead of being given a verifier.

## @evidence contracts/development/common.md#meaningful-documentation

States the execution rule and that a non-null `final` makes the draft inert, the escape hatch for keyframes, which fields are prose, how the beat names the shot when no id is supplied, and the duration unit and bounds.
