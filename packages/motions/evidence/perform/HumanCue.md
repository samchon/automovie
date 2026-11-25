# src/perform/HumanCue.ts#HumanCue.sectionWave

## @evidence contracts/development/common.md#meaningful-documentation

Defines cue indexing, time units, application examples and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Computes every propagated time independently from the path origin and preserves the input order in the track.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admits one timing source before a single scan of section values and resulting seconds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the authored speed and distances directly. It rejects malformed timing instead of sorting, clamping or inserting a guessed interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear time and output space in the number of sections.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns ordinary schedule cues so alignment and section indexing use the existing scheduler.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the returned list and retains no input or state.

# src/perform/HumanCue.ts#HumanCue.orders

## @evidence contracts/development/common.md#meaningful-documentation

States the event names, the source of the two parts and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each order contributes its two instants; the track is ordered by time, an earlier order first on a tie.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validation pass, one loop and one stable sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No interval between words is invented: every second is given.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A sort of the instants, which are few.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list and retains nothing.

# src/perform/HumanCue.ts#HumanCue.instants

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and why it is read structurally.

## @evidence contracts/development/implementation.md#principled-implementation

Each kept instant becomes a cue of its label; the track is ordered by time, the source's order kept on a tie.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter, one map and one stable sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is renamed or invented.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A sort of the instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list and retains nothing.

# src/perform/HumanCue.ts#HumanCue.beats

## @evidence contracts/development/common.md#meaningful-documentation

States the two event names, how they index and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Beat `i` falls `60 / bpm` seconds after beat `i - 1`, each computed from the first beat so no error accumulates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the beats.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The inputs are validated; the meter's default is the common time the member documents.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the beat count, which is the output's size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list and retains nothing.

# src/perform/HumanCue.ts#HumanCue.dialogue

## @evidence contracts/development/common.md#meaningful-documentation

States the four event names, how they index and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each line contributes its own instants, checked to lie inside it; the track is ordered by time, an earlier line first on a tie.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the lines and one stable sort.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No accent is invented for a line that gives none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A sort of the instants, which are few.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list and retains nothing.
