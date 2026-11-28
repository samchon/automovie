# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The action parameters state when water height, cycle count, pace, and course heading are used and which values apply when they are omitted.

## @evidence contracts/development/design.md#principled-representation

The action's kind records the authored outcome. Water level uses the same world plane as existing strokes, while a signed relative turn changes travel toward that heading throughout the dog-paddle action.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One extra stroke mode and one separate falter mode share the existing surface placement and transition. The optional turn makes the course meaningful only for dog paddle. The existing fixed-kind lexicon rows expose their existing cycle parameters.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The value chooses an authored surface action for the plan.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams.water

## @evidence contracts/development/common.md#meaningful-documentation

The height is in world metres, with a body-relative default at the action's entry.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams.count

## @evidence contracts/development/common.md#meaningful-documentation

The count is positive and whole. A regular stroke defaults to three cycles. The falter has one authored pass.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams.manner

## @evidence contracts/development/common.md#meaningful-documentation

Pace changes the time per cycle. The course length stays fixed.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams.turn

## @evidence contracts/development/common.md#meaningful-documentation

The interval is from -90 to 90 degrees relative to entry, with positive yaw toward the performer's left. Omission keeps the dog paddle straight. Other surface modes accept zero.

# src/motion/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The union describes advancing dog paddle, stationary upright tread, and one short authored falter with a breathing cue and a separately chosen recovery action.

## @evidence contracts/development/design.md#principled-representation

The mode records the surface action the author chose. Tread, paddle, falter and recovery have separate displayed outcomes and do not derive the choice from proficiency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The existing surface choice owns the new dog-paddle and falter values. Every value uses the same water height, action clock and placed motion entry.
