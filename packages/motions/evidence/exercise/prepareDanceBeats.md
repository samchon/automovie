# src/exercise/prepareDanceBeats.ts#prepareDanceBeats

## @evidence contracts/development/common.md#meaningful-documentation

States the beat rule, the lock and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The locked period is the mean interval of the track's beats; the unlocked one is the tempo's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, lock, period, reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The beat is never moved by a manner or a step.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the track's cues; each beat read is constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one beat rule for the dance, tap, ballet and street laws.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the locked instants only.
