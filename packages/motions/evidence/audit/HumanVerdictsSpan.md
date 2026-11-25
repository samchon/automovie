# src/audit/HumanVerdictsSpan.ts#HumanVerdictsSpan

## @evidence contracts/development/common.md#meaningful-documentation

States the span's timebase (its seconds start at `from`), the shifted action spans and the whole-film identity case.

## @evidence contracts/development/implementation.md#principled-implementation

A span is a change of timebase: every reader adds `from` to its second and every action span's start, entry and end lose `from`, so a bound read over the span reads the film's own instants.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the span's timebase for `HumanVerdicts`, which reads a report's span and a support stretch's piece through it; moved from `HumanVerdicts` unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Optional support and water readers stay absent when the motion has none; nothing is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant construction; each read adds one offset, and the action spans are mapped per call in their count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The whole film reuses the motion itself; a span keeps no reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the source motion and the two seconds, for the returned motion's life.
