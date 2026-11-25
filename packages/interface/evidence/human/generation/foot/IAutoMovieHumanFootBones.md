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
