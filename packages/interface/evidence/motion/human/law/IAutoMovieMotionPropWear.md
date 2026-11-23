# src/motion/human/law/IAutoMovieMotionPropWear.ts#IAutoMovieMotionPropWear

## @evidence contracts/development/common.md#meaningful-documentation

A planned prop attachment to a humanoid bone beginning at a share of the action's duration. Performance placement applies the attachment after the action's wear event.

## @evidence contracts/development/design.md#principled-representation

from: Share of this action from which the prop is worn. wearer: The performer whose bone it rides; the acting performer when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Wear-producing action plans publish bone attachments consumed by performance prop placement; the record owns the transition event rather than duplicating a prop's persistent worn configuration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The start is a normalized duration share. Performance placement resolves the prop and bone and captures its attachment transform; no film-second alias is substituted.

# src/motion/human/law/IAutoMovieMotionPropWear.ts#IAutoMovieMotionPropWear.ILink

## @evidence contracts/development/common.md#meaningful-documentation

States what a link binds, how far it lets the ends separate, in metres, and when it frees them.

## @evidence contracts/development/design.md#principled-representation

A link is a second end and a slack: the wearer's other bone or a scene target, and the most the two ends may separate, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two kinds of second end the arrest and captive scenes bind, and one length, read by performance prop placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two ends are optional fields rather than a union; exactly one end kind is required, and naming both or neither or a negative or non-finite slack is refused when the performance is built.
