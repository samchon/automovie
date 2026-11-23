# src/motion/human/audit/IAutoMovieMotionHumanVerdicts.ts#IAutoMovieMotionHumanVerdicts

## @evidence contracts/development/common.md#meaningful-documentation

unended: The flights still in the air at the film's end (#3479), each as `prop@launch-second`: allowed, since a shot into the distance is legitimate, and so reported apart from the findings. `of` always fills it; absent from a report built by hand.

## @evidence contracts/development/design.md#principled-representation

unended: The flights still in the air at the film's end (#3479), each as `prop@launch-second`: allowed, since a shot into the distance is legitimate, and so reported apart from the findings. `of` always fills it; absent from a report built by hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of, span); audit/HumanVerdicts.ts (HumanVerdicts.of, return); audit/HumanVerdicts.ts (HumanVerdicts.describe, report); audit/HumanVerdicts.ts (HumanVerdicts.of.place, return); audit/HumanVerdicts.ts (HumanVerdicts.describe, f); audit/HumanVerdicts.ts (HumanVerdicts.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanVerdicts.of.

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
