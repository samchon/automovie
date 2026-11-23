# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IChessMove

## @evidence contracts/development/common.md#meaningful-documentation

Names the board, the piece, the target square, the capture and where it goes.

## @evidence contracts/development/design.md#principled-representation

Square names, subjects and a world point; the occupancy is the board state before the move.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.chessMove` reads to compose and to refuse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A capture names its piece; an occupied target without it is refused.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IDeal

## @evidence contracts/development/common.md#meaningful-documentation

Names the cards in dealing order, the seats and the hand.

## @evidence contracts/development/design.md#principled-representation

Subjects and world points; cards land at their declared face-down attitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.deal` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each card is a real subject; a seat beyond the arm is refused by the placement.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.ILay

## @evidence contracts/development/common.md#meaningful-documentation

Names the cards and each one's place and resting attitude.

## @evidence contracts/development/design.md#principled-representation

Subjects with world points and world unit quaternions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.lay` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each place pairs with one card.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

Names the point and the attitude.

## @evidence contracts/development/design.md#principled-representation

World metres and a world unit quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a laid card's placement reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members are required.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IShuffle

## @evidence contracts/development/common.md#meaningful-documentation

Names the two packets' carrying cards, the left packet's top card and where the deck is squared.

## @evidence contracts/development/design.md#principled-representation

Subjects and one world point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.shuffle` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The packets keep their own cards; none is copied.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IPush

## @evidence contracts/development/common.md#meaningful-documentation

Names the carrying prop and the destination.

## @evidence contracts/development/design.md#principled-representation

A subject and a world point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.push` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The stack moves whole on its bottom prop.

# src/motion/human/handling/IAutoMovieMotionHumanTabletop.ts#IAutoMovieMotionHumanTabletop.IRoll

## @evidence contracts/development/common.md#meaningful-documentation

Names the die and where it comes to rest.

## @evidence contracts/development/design.md#principled-representation

A subject and a world point on the table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `HumanTabletop.roll` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The die keeps its subject.
