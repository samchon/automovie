# src/motion/human/everyday/IAutoMovieMotionHumanRise.ts#IAutoMovieMotionHumanRise.IParams

## @evidence contracts/development/common.md#meaningful-documentation

to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent.

## @evidence contracts/development/design.md#principled-representation

to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.rise, params); everyday/rise.ts (rise.plan, context); lexicon/HumanMountOff.ts (HumanMountOff.plan, context); lexicon/HumanMountOff.ts (HumanMountOff.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/everyday/IAutoMovieMotionHumanRise.ts#IAutoMovieMotionHumanRise.Stance

## @evidence contracts/development/common.md#meaningful-documentation

States that it holds one placement per foot, standing flat, in the placement frame of `HumanFoot`.

## @evidence contracts/development/design.md#principled-representation

A record keyed by the two sides, each a foot placement, the form `foot` and `lift` read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here for the rise and read by the stance solver and the kiss; it reuses `IAutoMovieMotionHumanFoot.IPlacement` instead of a second foot type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed pair of keys, so neither a third foot nor a missing one can be written.

# src/motion/human/everyday/IAutoMovieMotionHumanRise.ts#IAutoMovieMotionHumanRise.ILegsProps

## @evidence contracts/development/common.md#meaningful-documentation

body: Borrowed body measurements and joint ranges used to compose the rising legs. from: Beginning of the leg primitive in action-relative seconds. to: End of the leg primitive in action-relative seconds.

## @evidence contracts/development/design.md#principled-representation

body: Borrowed body measurements and joint ranges used to compose the rising legs. from: Beginning of the leg primitive in action-relative seconds. to: End of the leg primitive in action-relative seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanRise.ts (AutoMovieMotionHumanRise.legs, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanRise.Stance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
