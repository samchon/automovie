# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Climb family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One registered vocabulary entry; planCover in motions is the only consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No wall plane, opening or hinge is restated; they come from the props.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.Against

## @evidence contracts/development/common.md#meaningful-documentation

States both values.

## @evidence contracts/development/design.md#principled-representation

A closed choice of the side against the wall.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the sidle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted values are declared here directly.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.IPeek

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and default.

## @evidence contracts/development/design.md#principled-representation

The wall's face and the end peeked past; exposure in metres past the end's plane; hold in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the peek reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The end's plane comes from the face's width.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.ISidle

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and default.

## @evidence contracts/development/design.md#principled-representation

The face, the signed distance along it in metres and the trunk's gap from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the sidle reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lane follows from the face and the body's depth.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States each member and unit.

## @evidence contracts/development/design.md#principled-representation

The window prop and the signed distance past it along its wall, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the window passage reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sill height and opening width come from the window.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.IBreach

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The door prop; its hinge and handle place the strike and the swing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The field the breach reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A door that opens toward the performer or is out of reach is refused at runtime.

# src/motion/human/next/IAutoMovieMotionHumanCover.ts#IAutoMovieMotionHumanCover.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union on kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variants planCover dispatches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.
