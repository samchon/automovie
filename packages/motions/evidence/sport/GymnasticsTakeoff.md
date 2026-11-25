# src/sport/GymnasticsTakeoff.ts#GymnasticsTakeoff

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The apex is v_y² / 2g, the jump's own law; the landing place is corrected by the missing horizontal velocity times the jump's flight time, which is linear in the place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A guess, then the corrections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The velocity returned is the one the last plan shows, not the one asked.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four original jump plans and all eight actual millisecond COM samples remain. One genuine fixed-name mass FK preparation serves all four launch readings; each still fully resolves its own current demands, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body/model shares only its prepared bone-name membership. Each launch owns separate synchronous FK/projector loans for its two actual samples, never sharing a posture, time result, requested velocity or source between correction passes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local launch reader's bounded demand releases with this synchronous correction operation; no FK/projector loan or query history enters the result. Only the last original jump plan and its numeric launch vectors escape.

# src/sport/GymnasticsTakeoff.ts#GymnasticsTakeoff.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States which windows are kept, the cut and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each window's seconds in the push-off, clipped to the take-off, over the new duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No window is stretched past where the push-off ends it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the windows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The push-off's own windows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
