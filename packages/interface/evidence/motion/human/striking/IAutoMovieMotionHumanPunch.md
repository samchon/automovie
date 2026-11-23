# src/motion/human/striking/IAutoMovieMotionHumanPunch.ts#IAutoMovieMotionHumanPunch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, range and default.

## @evidence contracts/development/design.md#principled-representation

Closed unions for the technique and the hand, the interface's motion target, the accuracy union and a feint share in (0, 1), checked when planning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan, the defence's telegraph and the kickboxing rules read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the target and accuracy types.

# src/motion/human/striking/IAutoMovieMotionHumanPunch.ts#IAutoMovieMotionHumanPunch.IManner

## @evidence contracts/development/common.md#meaningful-documentation

States what the two members change and what they leave to the performer's skill.

## @evidence contracts/development/design.md#principled-representation

Two shares in [0, 1]; the punch maps `aimSkill` onto the manner's `consistency` when it draws the spread.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members the punch's aim spread reads; the manner's other members do not apply to a punch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: a named type instead of an inline pick of the manner, and its own name for the aim skill, since `accuracy` is the declared outcome.

# src/motion/human/striking/IAutoMovieMotionHumanPunch.ts#IAutoMovieMotionHumanPunch.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Names the three punches and the three close hand strikes.

## @evidence contracts/development/design.md#principled-representation

A closed union; each literal selects the striking surface, the arrival direction, the hand's attitude and the elbow band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the punch law and its strike rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the punch law owns each technique's geometry.

# src/motion/human/striking/IAutoMovieMotionHumanPunch.ts#IAutoMovieMotionHumanPunch.Hand

## @evidence contracts/development/common.md#meaningful-documentation

Names the two hands by the stance.

## @evidence contracts/development/design.md#principled-representation

A closed union of the stance's two hands, so no other hand type-checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the punch law's `hand` member and by the strike family's punch presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the stance owns which physical hand each names.
