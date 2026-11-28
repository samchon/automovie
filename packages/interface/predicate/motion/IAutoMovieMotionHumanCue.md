# src/motion/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats

## @evidence contracts/development/common.md#meaningful-documentation

The caller supplies a tempo, beat count and optional first second and meter. The fields give their numeric constraints and defaults. The type explains the two cue names, their occurrence indexes and the builder's representation checks.

## @evidence contracts/development/design.md#principled-representation

Tempo is a positive finite number of beats per minute and may be fractional. The absolute starting second is finite. Beat count and beats per bar are positive safe integers because they count discrete events. The cue constructor owns those checks and verifies both endpoint seconds and total cue cardinality before emission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type gives the author only the clock origin, spacing, number of beats and grouping. The cue owner derives each second and emits ordinary schedule cues, which downstream time readers select by name and occurrence. Omitting the first second and meter specifies the documented defaults without a separate mode.

# src/motion/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats.bpm

## @evidence contracts/development/common.md#meaningful-documentation

BPM controls the time between beats. It must be positive and finite, and its numeric value can be fractional.

# src/motion/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats.from

## @evidence contracts/development/common.md#meaningful-documentation

The optional finite film second places the first downbeat. Omit it to start at time zero.

# src/motion/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats.count

## @evidence contracts/development/common.md#meaningful-documentation

The count is the positive safe integer number of requested beat events. The constructor also fits the derived downbeats into the same output array.

# src/motion/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats.meter

## @evidence contracts/development/common.md#meaningful-documentation

The positive safe integer meter groups beats into bars and therefore sets the downbeat index spacing. An omitted meter gives four beats per bar.
