# src/human/generation/hand/IAutoMovieHumanHandHeel.ts#IAutoMovieHumanHandHeel

## @evidence contracts/development/common.md#meaningful-documentation

Describes the shared hand form and callbacks mapping its heel into the forearm's left frame; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The shared hand form and callbacks mapping its heel into the forearm's left frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHandHeel; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HandHeel contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/hand/IAutoMovieHumanHandHeel.ts#IAutoMovieHumanHandHeel.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A heel's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `form`: The hand form, shared by every person. `map`: The hand's map from the form's axes to the left frame, origin placed on the forearm's wrist. `bone`: The bone tube's point at a station `a` of the hand's axis and a phase `t` of the arm's section, left frame, mm: the arm's cut, or the wrist span's end section copied (the heel starts from it).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHandHeel.point, AutoMovieHumanHandHeel.creaseJet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `form`, `map`, `bone`; callers supply the complete record.
