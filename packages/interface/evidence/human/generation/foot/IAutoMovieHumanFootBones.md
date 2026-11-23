# src/human/generation/foot/IAutoMovieHumanFootBones.ts#IAutoMovieHumanFootBones

## @evidence contracts/development/common.md#meaningful-documentation

Describes sided foot joint centres and toe lines, retaining the canonical foot frame; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Sided foot joint centres and toe lines, retaining the canonical foot frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootBones; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootBones contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/foot/IAutoMovieHumanFootBones.ts#IAutoMovieHumanFootBones.IBones

## @evidence contracts/development/common.md#meaningful-documentation

One side's centres, reflected for the side.

## @evidence contracts/development/design.md#principled-representation `ankle`: Ankle centre, at the lateral malleolus height. `malleoli`: Lateral and medial malleoli. `heads`: Metatarsal head centres, hallux first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLimbRest.foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ankle`, `malleoli`, `heads`, `ball`, `toes`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootBones.ts#IAutoMovieHumanFootBones.ICentres

## @evidence contracts/development/common.md#meaningful-documentation

A foot's centres and the frame they stand in.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Toe lines: head centre and apex, left frame. `bones`: Centres, reflected for the side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootBones.of. Also types AutoMovieHumanFootConstruction.centres.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `lines`, `bones`; callers supply the complete record.
