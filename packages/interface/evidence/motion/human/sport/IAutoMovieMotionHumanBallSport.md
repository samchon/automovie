# src/motion/human/sport/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport

## @evidence contracts/development/common.md#meaningful-documentation

Describes the legacy skills, their compatibility with implied motion, and the shared flight and custody of the modeled court releases.

## @evidence contracts/development/design.md#principled-representation

The selected skill controls whether a named prop flies or the action only plans the posture. Targets and times are world metres and action or flight seconds respectively.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.ballSport, params); sport/ballSport.ts (ballSport.plan, context); sport/ballSport.ts (ballSport.plan); executable/cases/ballSportCases.ts (ballSportCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/sport/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The skill, hand, implied bounce count, release prop and aim, and optional volleyball contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/sport/IAutoMovieMotionHumanBallSport.ts#IAutoMovieMotionHumanBallSport.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Enumerates the legacy, planted court and volleyball actions.

## @evidence contracts/development/design.md#principled-representation

Each literal dispatches to a fixed support and interaction profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/ballSportCases.ts (ballSportCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literals leave support, pose and prop handling with the motion dispatch and its planners.
