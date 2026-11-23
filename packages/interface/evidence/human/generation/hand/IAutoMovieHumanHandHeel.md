# src/human/generation/hand/IAutoMovieHumanHandHeel.ts#IAutoMovieHumanHandHeel.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A heel's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `form`: The hand form, shared by every person. `map`: The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist. `bone`: The bone tube's point at a station `a` of the hand's axis and a phase `t` of the arm's section, left frame, mm: the arm's cut, or the wrist span's end section copied (the heel starts from it).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandHeel.point, AutoMovieHumanHandHeel.creaseJet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `form`, `map`, `bone`; callers supply the complete record.
