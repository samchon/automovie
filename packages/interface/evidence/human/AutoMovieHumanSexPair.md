# src/human/AutoMovieHumanSexPair.ts#AutoMovieHumanSexPair

## @evidence contracts/development/common.md#meaningful-documentation

Female then male reference statistics in the order used by Human's surveys.

## @evidence contracts/development/design.md#principled-representation

Female then male reference statistics in the order used by Human's surveys. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanSexPair is the canonical exchange used by AutoMovieHumanBackProfile.SHAPE, AutoMovieHumanBodyAnatomy.MEAN_AGE, AutoMovieHumanBodyAnatomy.BMI, AutoMovieHumanBodyAnatomy.WAIST_HEIGHT_SHARE.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBackProfile.SHAPE, AutoMovieHumanBodyAnatomy.MEAN_AGE, AutoMovieHumanBodyAnatomy.BMI, AutoMovieHumanBodyAnatomy.WAIST_HEIGHT_SHARE for female then male reference statistics in the order used by Human's surveys.
