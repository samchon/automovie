# src/human/skeleton/IAutoMovieHumanBindBone.ts#IAutoMovieHumanBindBone

## @evidence contracts/development/common.md#meaningful-documentation

One bone at rest.

## @evidence contracts/development/design.md#principled-representation `bone`: Bone id. `parent`: Parent bone, or null for the root. `position`: Joint centre at the achieved bind, metres in Human registered coordinates (+X forward, +Y up, +Z anatomical left).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanCanonicalBody.bones, AutoMovieHumanSkeleton.rest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `parent`, `position`, `tip`, `radius`; callers supply the complete record.
