# src/compose/composeAutoMovieMotionHumanAction.ts#composeAutoMovieMotionHumanAction

## @evidence contracts/development/common.md#meaningful-documentation

States what the base and the clock give, the writing order, where contacts and weapons come from, which channels the plan reports and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Backward data-flow starts with demanded output channels, replaces each active contributor's claims by its declared reads, then evaluates those writers in their original order. A missing read declaration means the whole posture, preserving arbitrary callback dependencies. A time-local declaration applies at the same clamped local second passed to its writer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sort and validate once, encode fixed channel masks once, collect contacts/weapons once and give each prefix one stable reader. One recursive dependency evaluator owns both complete and restricted posture reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Overlapping channel windows still refuse and endpoint allowances and stable order are unchanged. Only explicitly demanded channels may be read from a restricted result; declared-independent writes remain pure. Every primitive still prepares once, even when a later partial read needs none of its output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorting is O(P log P) and overlap admission O(P squared) once. Each actual prefix/demand/time key costs one lookup plus its not-yet-completed contributors and posture merges. There are nine channels, at most 512 masks per prefix and exact second; normal full-only reads visit at most P prefixes per second. Preparation queries release each separate refinement history. Runtime and peak-byte changes are unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed claims/dependencies reuse plan masks; exact time/prefix/demand keys share completed pure writes only inside one query/context. FK/ROM loans reach actual base reads and synchronous primitive writes, and the posture's explicit evaluation reaches every primitive write of its query as the write's trailing argument. Prefix readers inherit omitted loans; a changed explicit loan starts a fresh map, while top-level preparation/posture reads remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains base/clock/primitives, masks/mergers and stable readers only. Each query owns up to 512*(P+1)*T posture references for its actual T seconds, without global history or arbitrary eviction. Every ordinary or changed-loan query finally restores enclosing map/FK/projector on success/throw; failed writes publish nothing and retained readers capture no completed map or loan.
