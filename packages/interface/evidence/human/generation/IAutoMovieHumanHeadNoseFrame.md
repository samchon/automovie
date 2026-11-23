# src/human/generation/IAutoMovieHumanHeadNoseFrame.ts#IAutoMovieHumanHeadNoseFrame

## @evidence contracts/development/common.md#meaningful-documentation

Describes physical nose dimensions and the normalized nasion-to-tip height coordinate; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Physical nose dimensions and the normalized nasion-to-tip height coordinate. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHeadNoseFrame; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HeadNoseFrame contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanHeadNoseFrame.ts#IAutoMovieHumanHeadNoseFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

The nose's measures at one height.

## @evidence contracts/development/design.md#principled-representation `span`: Length of the nose's axis, nasion over the pronasale, millimetres. `width`: The nose's half width, the alar lobules' half span, millimetres. `lead`: The tip's lead past the face, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadNoseFrame.at. Read by AutoMovieHumanHeadNoseAla.lobes, AutoMovieHumanHeadNoseBridge.ridge, AutoMovieHumanHeadNoseTip.ball. Also types AutoMovieHumanHeadNose.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `span`, `width`, `lead`, `v`, `lobeY`; callers supply the complete record.
