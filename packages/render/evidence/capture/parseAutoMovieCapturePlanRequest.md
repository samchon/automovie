# src/capture/parseAutoMovieCapturePlanRequest.ts#parseAutoMovieCapturePlanRequest

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates every key with its accepted text and absent value, states every refusal and what each names, and which checks are left to the planner and why.

## @evidence contracts/development/implementation.md#principled-implementation

The keys are admitted before any value is read, so a mistyped option stops the request instead of being ignored; inspection keys and pass names go through the inspection core's own reader, and view texts through its view grammar, so no rule is restated here. Defaults come from the visual-debugging skill (rate, window), FFmpeg's `scdet` (threshold) and the Claude vision guide (budget edges).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the keys, read the inspection, then one helper per value form: number, number list, whole number, name and pattern list; the record literal reads in the table's order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unreadable text throws instead of falling back to the absent value, and two keys that would ask the same thing twice (`at` with a range, `passes` with `shade`) throw instead of one silently winning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of keys and the length of their text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each key is read once per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing; the source is read and dropped and the returned record is the caller's.
