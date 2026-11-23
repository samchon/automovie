# src/production/IAutoMovieProductionSoundEvent.ts#IAutoMovieProductionSoundEvent

## @evidence contracts/development/design.md#principled-representation

Sound planning maps current shot event samples into film occurrences, samples camera placement and models population variance from uniform axis-aligned boxes before sqrt(memberCount) gain and optional propagation. It copies acousticProfile without deriving event responses; a consumer supplies those separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One event carries authoritative timing, spatial mass and bounded acoustic results so the pure mixer needs no scene traversal or policy selection while rendering PCM.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Population spread is a box-based source approximation rather than measured individual positions. Selecting an acoustic profile does not populate or require acousticResponse in the standalone planner or mixer; callers own any stronger response-admission policy.

## @evidence contracts/development/common.md#meaningful-documentation

Defines occurrence identity, film frame and seconds, world-meter source/listener positions, RMS spread, incoherent density, stereo pan and optional propagation and room-response effects.
