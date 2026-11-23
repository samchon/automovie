# src/motion/human/compose/IAutoMovieMotionHumanTiming.ts#IAutoMovieMotionHumanTiming.Pause

## @evidence contracts/development/common.md#meaningful-documentation

States what is named; `PAUSES` gives each length.

## @evidence contracts/development/design.md#principled-representation

A closed union of the lengths a phrase holds for, so a law states a pause the table supplies and types no seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four names, each with a shipped law that uses its length.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A length between two names is the scale rung of `Span`, never a fifth name without a user.

# src/motion/human/compose/IAutoMovieMotionHumanTiming.ts#IAutoMovieMotionHumanTiming.ITravel

## @evidence contracts/development/common.md#meaningful-documentation

States the record; each member states its unit and the rule it selects.

## @evidence contracts/development/design.md#principled-representation

The two inputs of the timing rules above, so a phase states what moves how far and the rule supplies the seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; read by `seconds`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The width is optional because a free movement has none; none is invented.

# src/motion/human/compose/IAutoMovieMotionHumanTiming.ts#IAutoMovieMotionHumanTiming.Span

## @evidence contracts/development/common.md#meaningful-documentation

States the three rungs and the scale's range.

## @evidence contracts/development/design.md#principled-representation

Intent first and seconds on demand: every rung resolves to seconds, the unit the action clock takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One union of four members; read by `seconds`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The explicit rung requires its source by type; the scale is bounded so it cannot stand in for another name.

# src/motion/human/compose/IAutoMovieMotionHumanTiming.ts#IAutoMovieMotionHumanTiming.IRoles

## @evidence contracts/development/common.md#meaningful-documentation

States the record; each member states its phase and its value when absent.

## @evidence contracts/development/design.md#principled-representation

The members of the action clock's phrase, each a `Span` instead of seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Mirrors `IAutoMovieMotionPhraseDurations` member for member; read by `phrase`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent hold stays absent, so the clock's own rule for a missing phase applies.

# src/motion/human/compose/IAutoMovieMotionHumanTiming.ts#IAutoMovieMotionHumanTiming.IOfPlace

## @evidence contracts/development/common.md#meaningful-documentation

solid: Whether the target is a physical contact, selecting contact timing rather than a free-space pause. width: Target width in metres when known; omitted uses the timing law's unmeasured-target case.

## @evidence contracts/development/design.md#principled-representation

solid: Whether the target is a physical contact, selecting contact timing rather than a free-space pause. width: Target width in metres when known; omitted uses the timing law's unmeasured-target case.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTiming.ts (AutoMovieMotionHumanTiming.of, place).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanTiming.of.
