# src/human/generation/foot/IAutoMovieHumanFootToeLines.ts#IAutoMovieHumanFootToeLines

## @evidence contracts/development/common.md#meaningful-documentation

Metatarsal-head and toe-apex points in the left calibration frame. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only ILine declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

ILine separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanFootToeLines exchanges the named ILine contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/foot/IAutoMovieHumanFootToeLines.ts#IAutoMovieHumanFootToeLines.ILine

## @evidence contracts/development/common.md#meaningful-documentation

A toe's line.

## @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex, left frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeLines.of. Read by AutoMovieHumanFootToeJoints.of, AutoMovieHumanFootToeSpacing.limit. Also types AutoMovieHumanFootBones.lines, AutoMovieHumanFootToeBreadth.neighbours.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `head`, `tip`; callers supply the complete record.
