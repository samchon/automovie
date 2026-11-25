# src/lexicon/HumanLanceCouchHanging.ts#HumanLanceCouchHanging
## @evidence contracts/development/common.md#meaningful-documentation

States how the carry hangs (the upper arm out and down, the forearm at the grasp angle, clear of the horse), how it is chosen and when it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

The upper arm is laid along `UPPER` from the shoulder; each turn of the forearm about the shaft by `AROUND` gives a carriage (`HumanLanceCouchCarriage`), those clear of the horse (`HumanLanceCouchClear`) are ranked by the hand's turn from the entered hand, and the first the arm fit holds is taken (`HumanLanceCouchPick`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanLanceCouch` as the carry the lance rests in before the strike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`UPPER` and `AROUND` are provisional; a carry none holds is refused on `target` with the counts it read and the nearest miss.

## @evidence contracts/development/implementation.md#efficient-algorithms

360 / `AROUND` carriages, each a closed form and a clearance test, then at most `TRIES` arm fits.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the plan keeps the carry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
