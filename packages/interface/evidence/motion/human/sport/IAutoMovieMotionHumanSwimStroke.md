# src/motion/human/sport/IAutoMovieMotionHumanSwimStroke.ts#IAutoMovieMotionHumanSwimStroke.Name

## @evidence contracts/development/common.md#meaningful-documentation

The strokes on a body (provisional angles, seconds and speeds). A keyed stroke's name.

## @evidence contracts/development/design.md#principled-representation

Closed choices "breaststroke", "backstroke", "float" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/SwimStroke.ts (SwimStroke.strokes, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in SwimStroke.strokes.

# src/motion/human/sport/IAutoMovieMotionHumanSwimStroke.ts#IAutoMovieMotionHumanSwimStroke.IStroke

## @evidence contracts/development/common.md#meaningful-documentation

keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional).

## @evidence contracts/development/design.md#principled-representation

keys: The keys of one cycle and the seconds to reach each. speed: The hips' speed, metres a second, along the way the stroke travels (provisional).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/SwimStroke.ts (SwimStroke.strokes, return); sport/SwimStroke.ts (SwimStroke.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanExerciseKey.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanSwimStroke.ts#IAutoMovieMotionHumanSwimStroke.IPlanProps

## @evidence contracts/development/common.md#meaningful-documentation

The named keys and tempo prescribe joint movement, while the water level and stationary choice set the moving or fixed hip target.

## @evidence contracts/development/design.md#principled-representation

The stationary flag holds the original staged hip target without supplying an alternative arbitrary speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/SwimStroke.ts (SwimStroke.plan, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSwimStroke.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
