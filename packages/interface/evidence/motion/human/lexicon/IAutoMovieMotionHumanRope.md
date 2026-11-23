# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.Descent

## @evidence contracts/development/common.md#meaningful-documentation

States both styles.

## @evidence contracts/development/design.md#principled-representation

A closed choice of technique.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the descent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted values are declared here directly.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.Traverse

## @evidence contracts/development/common.md#meaningful-documentation

States both styles.

## @evidence contracts/development/design.md#principled-representation

A closed choice of which limbs bear.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the traverse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted values are declared here directly.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.IClimb

## @evidence contracts/development/common.md#meaningful-documentation

States each member and unit.

## @evidence contracts/development/design.md#principled-representation

The rope and the rise of the hands, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the climb reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rope's length bounds the rise at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.IDescend

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and default.

## @evidence contracts/development/design.md#principled-representation

The rope, the technique and the speed bound, metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the descent reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The descent's speed is held to the bound.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.ITraverseRope

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and default.

## @evidence contracts/development/design.md#principled-representation

The rope, the distance along it, metres, and the hang.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the traverse reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rope's ends bound the distance at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The rope and the named level surface to land on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the swing reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The release follows from the pendulum and the landing; an unreachable landing is refused.

# src/motion/human/lexicon/IAutoMovieMotionHumanRope.ts#IAutoMovieMotionHumanRope.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union on kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variants planRope dispatches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.
