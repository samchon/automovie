# src/human/generation/hand/IAutoMovieHumanHandThumbPosture.ts#IAutoMovieHumanHandThumbPosture

## @evidence contracts/development/common.md#meaningful-documentation

The bind's thumb, a pose convention like the fingers': each phalanx's direction in the hand's frame on its knuckles as `[spread, flexion]` in degrees, spread from the hand's axis toward the thumb's side, then flexion toward the palm (`AutoMovieHumanHandPosture.THUMB` holds the numbers and their basis).

## @evidence contracts/development/design.md#principled-representation `proximal`: The proximal phalanx, MCP to IP: `[spread, flexion]`, degrees. `distal`: The distal phalanx, IP to the tip: `[spread, flexion]`, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHandPosture.THUMB.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `proximal`, `distal`; callers supply the complete record.
