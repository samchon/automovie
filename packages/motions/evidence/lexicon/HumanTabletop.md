# src/lexicon/HumanTabletop.ts#HumanTabletop.chessMove

## @evidence contracts/development/common.md#meaningful-documentation

States the steps and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The board state decides legality before any step; the piece is put on the target square's socket by its base, so it lands at the square's centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the board, set the capture aside, then pick up and place the piece.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refusals name the square and the piece found there.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

At most four chained steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanTabletop.ts#HumanTabletop.deal

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the seats and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each card goes from the deck's top to the next seat in turn, at its declared face-down attitude.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pickup and one placement per card.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The placement owns the reach refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two steps per card.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanTabletop.ts#HumanTabletop.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the pairing and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each card is put down at its declared whole attitude through the placement's `rotation`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pickup and one placement per card.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The placement refuses an attitude the wrist cannot reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two steps per card.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanTabletop.ts#HumanTabletop.shuffle

## @evidence contracts/development/common.md#meaningful-documentation

States the holds and the join.

## @evidence contracts/development/implementation.md#principled-implementation

Each packet rides its bottom card, so a hand holds the whole packet; the right packet is set on the left packet's top card by its base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two pickups, then two placements.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The packets keep their cards; none is copied or moved by hand alone.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four chained steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanTabletop.ts#HumanTabletop.push

## @evidence contracts/development/common.md#meaningful-documentation

States what carries the stack and where it goes.

## @evidence contracts/development/implementation.md#principled-implementation

The stack's props ride its bottom prop, so moving it moves them all.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pickup and one placement.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanTabletop.ts#HumanTabletop.roll

## @evidence contracts/development/common.md#meaningful-documentation

States the pickup and the release onto the table.

## @evidence contracts/development/implementation.md#principled-implementation

The die is placed on the table's surface by its base, a quarter turn from how it lay.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pickup and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tumble between hand and table is not modelled; the die comes to rest at its place.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shipped pickup and placement laws.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
