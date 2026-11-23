# src/human/generation/IAutoMovieHumanDigitLine.ts#IAutoMovieHumanDigitLine.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

One bone of the line.

## @evidence contracts/development/design.md#principled-representation `direction`: Unit direction. `length`: Length along the arc, mm. `turn`: Half length of the turn onto the next leg at this leg's distal joint, mm; ignored on the last leg.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitLine.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `direction`, `length`, `turn`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanDigitLine.ts#IAutoMovieHumanDigitLine.ILine

## @evidence contracts/development/common.md#meaningful-documentation

A built line.

## @evidence contracts/development/design.md#principled-representation `points`: Points from the start, one every {@link ILine.step}. `step`: Spacing of the points along the arc. `length`: Arc length of the whole line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitLine.build. Also types AutoMovieHumanHandDigitBones.line.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `step`, `length`, `joints`, `at`, `tangent`; callers supply the complete record.
