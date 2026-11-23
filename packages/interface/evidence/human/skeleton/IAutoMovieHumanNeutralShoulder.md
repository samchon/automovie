# src/human/skeleton/IAutoMovieHumanNeutralShoulder.ts#IAutoMovieHumanNeutralShoulder

## @evidence contracts/development/common.md#meaningful-documentation

The shoulder's bind-to-neutral quaternion, downward unit direction and resting abduction angle. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanNeutralShoulder exchanges the named IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/skeleton/IAutoMovieHumanNeutralShoulder.ts#IAutoMovieHumanNeutralShoulder.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One shoulder's neutral.

## @evidence contracts/development/design.md#principled-representation `turn`: The upper arm's world turn from the bind. `down`: The arm's unit direction at neutral, from the shoulder down. `resting`: The resting abduction from the plumb line, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralShoulder.derive. Also types AutoMovieHumanNeutral.shoulder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `turn`, `down`, `resting`; callers supply the complete record.
