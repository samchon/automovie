# src/human/generation/IAutoMovieHumanSkeletonLaw.ts#IAutoMovieHumanSkeletonLaw.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Bind bones and the identical pure hand records from which their joints were placed.

## @evidence contracts/development/design.md#principled-representation `bones`: Parent-before-child bone records. `hands`: Actual sided joint/material-frame definitions, before any digit skin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanSkeletonLaw.define, AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.complete. Read by AutoMovieHumanSkeletonLaw.complete. Also types AutoMovieHumanBodyPreparation.anatomy, AutoMovieHumanBodySources.anatomy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bones`, `hands`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanSkeletonLaw.ts#IAutoMovieHumanSkeletonLaw.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What the skeleton reads besides the root.

## @evidence contracts/development/design.md#principled-representation `arms`: The arms' lengths, tapes and hands. `feet`: The feet's dimensions. `legs`: The legs' tapes and controls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanSkeletonLaw.derive, AutoMovieHumanSkeletonLaw.define, AutoMovieHumanSkeletonLaw.complete.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `arms`, `feet`, `legs`, `trunk`, `head`, `sex`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanSkeletonLaw.ts#IAutoMovieHumanSkeletonLaw.IBodyInputs

## @evidence contracts/development/common.md#meaningful-documentation

Body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.

## @evidence contracts/development/design.md#principled-representation

Body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSkeletonLaw.body, AutoMovieHumanSkeletonLaw.build for body-owned joints and their true neck attachment datum; no head mass or eye placement is needed.
