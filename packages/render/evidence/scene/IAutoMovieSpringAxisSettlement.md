# src/scene/IAutoMovieSpringAxisSettlement.ts#IAutoMovieSpringAxisSettlement

## @evidence contracts/development/design.md#principled-representation

Separates the nullable displayed joint angle from the damped solver's value/velocity state so a never-authored axis remains absent while existing history can decay after target removal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result pair lets AutoMoviePlayer use the same axis settlement rule for flexion, abduction and twist.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null means absence of target and spring history, not a forced zero that would reset an active decay during a paused update.

## @evidence contracts/development/common.md#meaningful-documentation

Documents displayed degrees, null-state meaning and player ownership of the next solver state.
