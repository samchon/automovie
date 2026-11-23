# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsWheel.ts#IAutoMovieMotionHumanGymnasticsWheel.ISpoke

## @evidence contracts/development/common.md#meaningful-documentation

height: The height of its joints' middle when it bears, world metres.

## @evidence contracts/development/design.md#principled-representation

height: The height of its joints' middle when it bears, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/cartwheel.ts (cartwheel.plan.spokes, return); sport/GymnasticsWheel.ts (GymnasticsWheel.roll.middle, spoke); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, spokes); sport/cartwheel.ts (cartwheel.plan); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts); sport/handspring.ts (handspring.over).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsWheel.ts#IAutoMovieMotionHumanGymnasticsWheel.IRow

## @evidence contracts/development/common.md#meaningful-documentation

angle: The turn's angle, degrees. root: The root, world metres. bears: The bearing spoke's index in the spokes.

## @evidence contracts/development/design.md#principled-representation

angle: The turn's angle, degrees. root: The root, world metres. bears: The bearing spoke's index in the spokes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, row); sport/handspring.ts (handspring.over.down, row); sport/GymnasticsWheel.ts (GymnasticsWheel.roll); sport/handspring.ts (handspring.over).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsWheel.ts#IAutoMovieMotionHumanGymnasticsWheel.IWheel

## @evidence contracts/development/common.md#meaningful-documentation

rows: Rows in increasing degrees from zero to until. The array is readonly but row objects are mutable; root reads these same objects, so consumers must preserve them while using the interpolator. root: The root linearly interpolated between neighbouring rows. The supplied angle must be finite; it is clamped to [0, until].

## @evidence contracts/development/design.md#principled-representation

rows: Rows in increasing degrees from zero to until. The array is readonly but row objects are mutable; root reads these same objects, so consumers must preserve them while using the interpolator. root: The root linearly interpolated between neighbouring rows. The supplied angle must be finite; it is clamped to [0, until].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.roll, return); sport/GymnasticsWheel.ts (GymnasticsWheel.contacts, wheel); sport/cartwheel.ts (cartwheel.plan); sport/handspring.ts (handspring.over); sport/roundOff.ts (roundOff.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanGymnasticsWheel.IRow, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanGymnasticsWheel.ts#IAutoMovieMotionHumanGymnasticsWheel.IRollProps

## @evidence contracts/development/common.md#meaningful-documentation

body: Borrowed body with all spoke bones admitted by its skeleton; roll does not validate bone availability. shaped: Synchronous posture sampler at a rotation angle in degrees, with the root at the origin. Called count + 1 times to construct the table; exceptions propagate and the callback is not retained. spokes: Nonempty borrowed list of bearing candidates in preference order. Each candidate must name admitted bones; roll does not validate these preconditions.

## @evidence contracts/development/design.md#principled-representation

body: Borrowed body with all spoke bones admitted by its skeleton; roll does not validate bone availability. shaped: Synchronous posture sampler at a rotation angle in degrees, with the root at the origin. Called count + 1 times to construct the table; exceptions propagate and the callback is not retained. spokes: Nonempty borrowed list of bearing candidates in preference order. Each candidate must name admitted bones; roll does not validate these preconditions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/GymnasticsWheel.ts (GymnasticsWheel.roll, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanGymnasticsWheel.ISpoke, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
