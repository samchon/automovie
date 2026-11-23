# src/lexicon/HumanGunCrew.ts#HumanGunCrew.IStageStation

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the performer, world station, cue offset in seconds, and gaze after arriving.

## @evidence contracts/development/design.md#principled-representation

A world-space walk mark and an ordinary gaze law describe the player's visible blocking, with a cue-relative time assigned separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only stage consumes these cues, using the existing walk and gaze contracts for motion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Marks, timing offsets and gaze are chosen by the scene author. The station's inputs are confined to performer blocking.

# src/lexicon/HumanGunCrew.ts#HumanGunCrew.stage

## @evidence contracts/development/common.md#meaningful-documentation

States the named cue, arrival offset, next gaze action, output order and ownership of props and effects.

## @evidence contracts/development/implementation.md#principled-implementation

End alignment uses each ordinary walk's solved duration, so different actors and marks can reach stations at the same cue without sharing a gait duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk and gaze chain per performer, with the timing, support and body mechanics delegated to the scheduler and existing actions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Marks, cast, offsets and gaze all belong to the scene. The composition uses the established walk and look actions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear work and allocation in the number of stations, with two actions and one alignment per station.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call constructs a new composition from the caller's current stage instructions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned tree belongs to the caller. The namespace retains no stage or work.
