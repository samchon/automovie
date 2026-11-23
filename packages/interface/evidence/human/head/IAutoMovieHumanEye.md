# src/human/head/IAutoMovieHumanEye.ts#IAutoMovieHumanEye

## @evidence contracts/development/common.md#meaningful-documentation

One eye opening measured between the Farkas landmarks, in millimetres.

## @evidence contracts/development/design.md#principled-representation `palpebralFissureLength`: Euclidean three-dimensional distance from endocanthion to exocanthion. `palpebralFissureHeight`: Upper to lower lid margin at the pupil, eye open at rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEye is the canonical exchange used by AutoMovieHumanHeadAnatomy.eye.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `palpebralFissureLength`, `palpebralFissureHeight`; callers supply the complete record.
