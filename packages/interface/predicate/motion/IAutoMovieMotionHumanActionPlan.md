# src/motion/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan.verifyDisplayed

## @evidence contracts/development/common.md#meaningful-documentation

Performance invokes the hook after placing this role's body display and before preparing grip hands, hits or soft props. Its bone reader and optional interval use the same film clock. The inclusive played range lets a verifier keep contact at the exact cut and ignore contact outside the cut. A verifier that uses the bone reader alone can omit the interval.

# src/motion/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan.IDisplayedInterval

## @evidence contracts/development/common.md#meaningful-documentation

The two fields identify the realized entry and ending in film seconds, with both boundaries included.

## @evidence contracts/development/design.md#principled-representation

The committed entry and end distinguish seconds the body display plays from the remaining planned duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interval carries the two authoritative times already needed by playback. The caller owns the segment and its plan.

# src/motion/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan.IDisplayedInterval.entryTime

## @evidence contracts/development/common.md#meaningful-documentation

The field identifies when the action becomes active on the film clock. A phase entry can begin after the nominal plan start.

# src/motion/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan.IDisplayedInterval.end

## @evidence contracts/development/common.md#meaningful-documentation

The field gives the last played film second after the cutoff has been applied.
