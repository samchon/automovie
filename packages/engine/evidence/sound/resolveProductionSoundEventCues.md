# src/sound/resolveProductionSoundEventCues.ts#resolveProductionSoundEventCues

## @evidence contracts/development/common.md#meaningful-documentation

Owns the join from declared shot and event ids to each retained film frame and returns normalized audio placements for the same plan lowering as fixed cues.

## @evidence contracts/development/implementation.md#principled-implementation

Adds a signed integral offset to the existing picture frame and admits the half-open placement against the film extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Indexes retained occurrences once, then validates each authoring cue and expands it into mix placements in the incoming event order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Distinguishes an unknown or ambiguous realization from a trimmed occurrence, refuses ambiguous ids and film overflow, and checks adopted asset identity, source trim, gain and fades even for removed occurrences. PCM availability belongs to mixing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses a linear event index and output expansion, plus a declaration/sample scan for each requested cue. Storage is linear in retained events, consumed authored and fixed cue ids, and expanded output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the plan's already projected event frames and original mix payload, with no second frame conversion or motion sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The identity index and sets are local, each output cue owns only scalar fields, and no decoder or external resource is acquired.
