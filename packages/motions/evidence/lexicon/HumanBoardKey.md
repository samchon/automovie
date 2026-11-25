# src/lexicon/HumanBoardKey.ts#HumanBoardKey
## @evidence contracts/development/common.md#meaningful-documentation

States the seated key, the seat it sits on and the pillion's set-back.

## @evidence contracts/development/implementation.md#principled-implementation

The key is `seated.point` and `seated.root` on the seat with the upright back's angles (`sitPlace.BACKS.upright`) and the legs hanging (`hangMountedLeg`); a pillion is set back along the seat's forward axis by the gap between the partner's displayed seat region at the landing and the front of its own pelvis (`HumanTrunk.region` groin).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cut out of `HumanBoard`'s plan as its key; the plan admits the way to it and samples toward it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seat's depth is the carrier's declared one, or none; the partner is read as displayed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One seated solve, and for a pillion one partner bone read and one region read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan; the plan keeps it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanBoardKey.ts#HumanBoardKey.IKey

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame.

## @evidence contracts/development/design.md#principled-representation

The seat in the seat's frame, the pillion's set-back in seat-frame metres and the seated key posture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `HumanBoardKey.of` and read by the boarding's plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is always present; a rider with no partner has no set-back (zero).
