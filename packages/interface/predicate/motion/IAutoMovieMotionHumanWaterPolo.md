# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.ball

## @evidence contracts/development/common.md#meaningful-documentation

The field names the original performance ball.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.center

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the observed physical sphere centre in world metres at the scoring instant.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.goal

## @evidence contracts/development/common.md#meaningful-documentation

The field names the goal whose aperture the sphere clears.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.kind

## @evidence contracts/development/common.md#meaningful-documentation

The literal identifies a credited goal event.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.scorer

## @evidence contracts/development/common.md#meaningful-documentation

The field names the performer whose launch crosses the mouth.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue.seconds

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the film second when the full sphere clears the plane.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.IGoal.ball

## @evidence contracts/development/common.md#meaningful-documentation

The field names the same scene ball throughout held and launched phases.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.IGoal.film

## @evidence contracts/development/common.md#meaningful-documentation

The field supplies displayed goal frames and resolved launches on one clock.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.IGoal.goal

## @evidence contracts/development/common.md#meaningful-documentation

The field describes the fixed level aperture and its field-facing orientation.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.ICue

## @evidence contracts/development/common.md#meaningful-documentation

The cue gives the event, named subjects, credit owner, film second and centre in world metres.

## @evidence contracts/development/design.md#principled-representation

A cue represents one completed crossing from one realized launch. Its scorer comes from that launch, and its time and centre are sampled at the same physical clearance instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ball, goal and scorer remain existing scene IDs. The cue carries only the geometry and timing needed to inspect the result.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.IFilm

## @evidence contracts/development/common.md#meaningful-documentation

The selected performance fields share the placed film clock in seconds.

## @evidence contracts/development/design.md#principled-representation

The fixed goal frame from `prop` shares the timeline of `flights` and `duration`. The scoring reader establishes the level aperture and launch admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The public model reuses the existing performance observations and does not own its schedule, bodies or prop preparation.

# src/motion/IAutoMovieMotionHumanWaterPolo.ts#IAutoMovieMotionHumanWaterPolo.IGoal

## @evidence contracts/development/common.md#meaningful-documentation

The input names one ball and a fixed goal in the same placed play, with the scoring plane at the mouth.

## @evidence contracts/development/design.md#principled-representation

A general prop supplies the goal. The reader admits fixed props whose named aperture has positive dimensions and a vertical plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields use existing scene and performance types; the scoring reader alone chooses which realized launches earn a cue.
