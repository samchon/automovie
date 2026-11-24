# src/handling/drawFromCarrierJudge.ts#drawFromCarrierJudge
## @evidence contracts/development/common.md#meaningful-documentation

States the samples judged, the bound and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's posture is resolved at `JUDGED` + 1 even samples of the draw and each moving hand's posed point is measured from its planned wrist; `GRIP` is half the 2 cm a scabbard is made wider than its blade, the play before the grip would bind it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `drawFromCarrier` as the plan-time judgement of its fitted hands; the plan calls it once after building its posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hand past `GRIP` refuses on `from.aperture` with the bound as the feasible range. `JUDGED` is a sample count with no cited source.

## @evidence contracts/development/implementation.md#efficient-algorithms

`JUDGED` + 1 whole-body resolves and hand reads, at plan time only.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check; it keeps nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
