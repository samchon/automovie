# src/human/generation/IAutoMovieHumanArmRootOval.ts#IAutoMovieHumanArmRootOval.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the oval reads.

## @evidence contracts/development/design.md#principled-representation `glenohumeral`: The glenohumeral centre `[x, y, z]`, mm. `radius`: The upper arm's girth radius, mm: the biceps tape over 2 pi. `cap`: The cap's outline from the centre's height to the shoulder point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmRootOval.at, AutoMovieHumanArmRootOval.outline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `glenohumeral`, `radius`, `cap`; callers supply the complete record.
