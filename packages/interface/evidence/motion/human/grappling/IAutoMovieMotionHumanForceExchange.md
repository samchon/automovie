# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

release: Seconds from the break to the release.

## @evidence contracts/development/design.md#principled-representation

release: Seconds from the break to the release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.swing, return); grappling/HumanForceThrow.ts (HumanForceThrow.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.swing.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IBreakingProps

## @evidence contracts/development/common.md#meaningful-documentation

edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.

## @evidence contracts/development/design.md#principled-representation

edge: The base's extent along the pull, metres. seconds: Seconds from the pull's start to the broken base.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.breaking, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.breaking.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IBrokenProps

## @evidence contracts/development/common.md#meaningful-documentation

edge: The base's extent along the pull, metres.

## @evidence contracts/development/design.md#principled-representation

edge: The base's extent along the pull, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.broken, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.broken.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IDrawnProps

## @evidence contracts/development/common.md#meaningful-documentation

seconds: Seconds since the pull started.

## @evidence contracts/development/design.md#principled-representation

seconds: Seconds since the pull started.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.drawn, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.drawn.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IDrawnResult

## @evidence contracts/development/common.md#meaningful-documentation

offset: Horizontal centre displacement along the pull, metres. speed: Horizontal centre velocity along the pull, metres per second. extrapolated: Extrapolated centre position offset + speed / pendulum frequency, metres.

## @evidence contracts/development/design.md#principled-representation

offset: Horizontal centre displacement along the pull, metres. speed: Horizontal centre velocity along the pull, metres per second. extrapolated: Extrapolated centre position offset + speed / pendulum frequency, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.drawn, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.drawn.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IResistedProps

## @evidence contracts/development/common.md#meaningful-documentation

height: The grip's height above the floor, metres. edge: The base's extent from the centre along the pull, metres.

## @evidence contracts/development/design.md#principled-representation

height: The grip's height above the floor, metres. edge: The base's extent from the centre along the pull, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.resisted, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.resisted.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.ISwingProps

## @evidence contracts/development/common.md#meaningful-documentation

radius: The centre's distance from the fulcrum, metres. angle: The starting angle from the vertical, radians, positive toward the throw. torque: The pull's moment about the fulcrum on the swing's axis while it lasts, N m; none when absent.

## @evidence contracts/development/design.md#principled-representation

radius: The centre's distance from the fulcrum, metres. angle: The starting angle from the vertical, radians, positive toward the throw. torque: The pull's moment about the fulcrum on the swing's axis while it lasts, N m; none when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.swing, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanForceExchange.swing.

# src/motion/human/grappling/IAutoMovieMotionHumanForceExchange.ts#IAutoMovieMotionHumanForceExchange.IPullProps

## @evidence contracts/development/common.md#meaningful-documentation

from: Film seconds, start. to: Film seconds, end.

## @evidence contracts/development/design.md#principled-representation

from: Film seconds, start. to: Film seconds, end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceExchange.ts (HumanForceExchange.pull, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanForceSite, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
