# src/cinematics/IAutoMovieResolveLensAt.ts#IAutoMovieResolveLensAt.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the intents' order freedom, the shot-local clock, the world metres of the position and the forward axis's length freedom.

## @evidence contracts/development/design.md#principled-representation

The camera's position and forward at the second, rather than a whole camera record, because the focused depth is a projection onto that axis from that point; the shot's intents are passed as recorded.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All four fields are read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present; a zero forward is a caller premise the camera record never produces.
