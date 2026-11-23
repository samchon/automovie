# src/motion/human/everyday/IAutoMovieMotionHumanSeated.ts#IAutoMovieMotionHumanSeated.ISeat

## @evidence contracts/development/common.md#meaningful-documentation

at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.

## @evidence contracts/development/design.md#principled-representation

at: The middle of the sitting surface's front edge, world metres; its height is the seat height. yaw: The heading a sitter faces, degrees about +Y. depth: Depth back from the front edge, metres; deep enough for the thigh when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/seated.ts (seated.high, seat); everyday/seated.ts (seated.ratio, seat); everyday/seated.ts (seated.check, seat); everyday/seated.ts (seated.point, seat); everyday/sitPlace.ts (sitPlace.reach, seat); lexicon/HumanMountOn.ts (HumanMountOn.plan, seat).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
