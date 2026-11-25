# src/lexicon/HumanLanceCouchPick.ts#HumanLanceCouchPick
## @evidence contracts/development/common.md#meaningful-documentation

States the order tried, the bound and what it returns when none holds.

## @evidence contracts/development/implementation.md#principled-implementation

The carriages are ranked by how far the hand turns from the entered hand, and the first whose arm fit holds within `StrikingRoll.MISS` is taken, so the forearm twists no further than it must.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanLanceCouch` as the ranked choice both carriage searches share; it returns the least miss so a refusal can report it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`TRIES` is a provisional count of candidates tried against the costly fit; it is a ranked scan, listed for the attitude owner (plan P4), not a tuned threshold of a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sort of the candidates and at most `TRIES` arm fits.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the candidates and the reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLanceCouchPick.ts#HumanLanceCouchPick.IOption

## @evidence contracts/development/common.md#meaningful-documentation

States the carriage and its turn's unit.

## @evidence contracts/development/design.md#principled-representation

A carriage and its hand's turn from the entered hand, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the two searches and read by `HumanLanceCouchPick`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanLanceCouchPick.ts#HumanLanceCouchPick.IPick

## @evidence contracts/development/common.md#meaningful-documentation

States both members and what an absent carriage means.

## @evidence contracts/development/design.md#principled-representation

The chosen carriage or none, and the least miss in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `HumanLanceCouchPick` to the searches, which refuse with the miss.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The absent carriage is explicit (`undefined`), the miss always present.
