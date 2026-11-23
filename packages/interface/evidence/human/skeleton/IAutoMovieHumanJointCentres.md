# src/human/skeleton/IAutoMovieHumanJointCentres.ts#IAutoMovieHumanJointCentres

## @evidence contracts/development/common.md#meaningful-documentation

Describes bind-joint records augmented with the outgoing segment's millimetre girth radius; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Bind-joint records augmented with the outgoing segment's millimetre girth radius. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanJointCentres; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing JointCentres contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/skeleton/IAutoMovieHumanJointCentres.ts#IAutoMovieHumanJointCentres.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

One joint: a bone's origin, parent, segment direction and girth.

## @evidence contracts/development/design.md#principled-representation `radius`: Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi at its middle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanJointCentres.derive. Read by AutoMovieHumanJointTurn.derive, AutoMovieHumanNeutral.frames, AutoMovieHumanNeutral.derive. Also types AutoMovieHumanBindingInputs.joints, AutoMovieHumanJointTurn.standing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `radius`; callers supply the complete record.
