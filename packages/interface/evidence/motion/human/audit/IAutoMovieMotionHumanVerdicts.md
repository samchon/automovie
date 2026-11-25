# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

check: The bound. subject: The performer, or `a+b` for a bound between two. act: The action the finding's instant lies in; empty before the performer's first action or for a bound read over the whole film.

## @evidence contracts/development/design.md#principled-representation

check: The bound. subject: The performer, or `a+b` for a bound between two. act: The action the finding's instant lies in; empty before the performer's first action or for a bound read over the whole film.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of.place, return); audit/HumanVerdicts.ts (HumanVerdicts.describe, f); audit/HumanVerdicts.ts (HumanVerdicts.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanVerdicts.of.place.

# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts.IReport

## @evidence contracts/development/common.md#meaningful-documentation

unended: The flights still in the air at the film's end (#3479), each as `prop@launch-second`: allowed, since a shot into the distance is legitimate, and so reported apart from the findings. `of` always fills it; absent from a report built by hand.

## @evidence contracts/development/design.md#principled-representation

unended: The flights still in the air at the film's end (#3479), each as `prop@launch-second`: allowed, since a shot into the distance is legitimate, and so reported apart from the findings. `of` always fills it; absent from a report built by hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of, return); audit/HumanVerdicts.ts (HumanVerdicts.describe, report).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanVerdicts.IFinding identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts.IOfSpan

## @evidence contracts/development/common.md#meaningful-documentation

from: Beginning of the judged interval, in performance seconds. to: End of the judged interval, in performance seconds.

## @evidence contracts/development/design.md#principled-representation

from: Beginning of the judged interval, in performance seconds. to: End of the judged interval, in performance seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of, span).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanVerdicts.of.

# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts.IPerformer

## @evidence contracts/development/common.md#meaningful-documentation

subject: The performer's subject, as the report names it. path: The film's canonical entity path of the performer. airborne: Whether the performer swims or climbs a ladder, so the floor, plant and balance bounds were left unread for them.

## @evidence contracts/development/design.md#principled-representation

One row per performer joining the report's subject to the film's path and to the airborne fact the coverage needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdictInspection.ts (HumanVerdictInspection.of, performers).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the report's subject identity; the mapper owns the admission of unknown subjects.

# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts.ISource

## @evidence contracts/development/common.md#meaningful-documentation

performance: The film's human performance. paths: The film's canonical entity path of each performer, by subject.

## @evidence contracts/development/design.md#principled-representation

What a film must supply for its performance's verdicts to be inspected: the performance and where each performer lives in the film.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdictInspection.ts (HumanVerdictInspection.read, source); template IFilmProduction.humanPerformance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the performance type unchanged; a missing path is refused by the reader.
