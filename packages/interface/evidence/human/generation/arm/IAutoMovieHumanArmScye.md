# src/human/generation/arm/IAutoMovieHumanArmScye.ts#IAutoMovieHumanArmScye

## @evidence contracts/development/common.md#meaningful-documentation

The shoulder opening's ring and downward physical-station derivatives in the left frame. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IRing declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IRing separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanArmScye exchanges the named IRing contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/arm/IAutoMovieHumanArmScye.ts#IAutoMovieHumanArmScye.IRing

## @evidence contracts/development/common.md#meaningful-documentation

The ring's place, size, outline and jet.

## @evidence contracts/development/design.md#principled-representation `centre`: Mean of the arc's points, left frame, mm. `radius`: Mean distance of the arc's points from the centre, mm. `outline`: The arc's points as `[x, z]` in the level plane, closed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmScye.of. Read by AutoMovieHumanArmLaw.of. Also types AutoMovieHumanArmConstruction.ring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `radius`, `outline`, `points`, `jets`; callers supply the complete record.
