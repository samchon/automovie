# src/human/generation/IAutoMovieHumanHeadAnatomy.ts#IAutoMovieHumanHeadAnatomy

## @evidence contracts/development/common.md#meaningful-documentation

Describes partial anatomical head measures and the closed set of measures receiving sex-specific defaults; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Partial anatomical head measures and the closed set of measures receiving sex-specific defaults. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHeadAnatomy; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HeadAnatomy contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanHeadAnatomy.ts#IAutoMovieHumanHeadAnatomy.Partially

## @evidence contracts/development/common.md#meaningful-documentation

A record in which every measure, at any depth, may be omitted.

## @evidence contracts/development/design.md#principled-representation

A record in which every measure, at any depth, may be omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadAnatomy.Partially is the canonical exchange used by IAutoMovieHumanHeadAnatomy.IInput.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by IAutoMovieHumanHeadAnatomy.IInput for a record in which every measure, at any depth, may be omitted.

# src/human/generation/IAutoMovieHumanHeadAnatomy.ts#IAutoMovieHumanHeadAnatomy.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A head input in which every measure may be omitted.

## @evidence contracts/development/design.md#principled-representation

A head input in which every measure may be omitted. Partially<IAutoMovieHumanHeadIdentity> retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadAnatomy.given.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadAnatomy.given for a head input in which every measure may be omitted.

# src/human/generation/IAutoMovieHumanHeadAnatomy.ts#IAutoMovieHumanHeadAnatomy.FaceMean

## @evidence contracts/development/common.md#meaningful-documentation

A head measure that defaults to its sex's adult mean.

## @evidence contracts/development/design.md#principled-representation

A head measure that defaults to its sex's adult mean. The closed alternatives are "faceHeight", "mandibularWidth", "minimumFrontalWidth", "mouthOpening", "mandibularLaterotrusion", "palpebralFissureLength", "palpebralFissureHeight", "intercanthalWidth", "noseWidth", "noseHeight", "noseProtrusion", "mouthWidth", "upperVermilionHeight", "lowerVermilionHeight".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadAnatomy.FACE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadAnatomy.FACE for a head measure that defaults to its sex's adult mean.
