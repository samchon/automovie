# src/human/generation/IAutoMovieHumanBodyPreparation.ts#IAutoMovieHumanBodyPreparation

## @evidence contracts/development/common.md#meaningful-documentation

Complete production preparation over the original body context, including head, eye and bind metadata. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanBodyPreparation exchanges the named IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanBodyPreparation.ts#IAutoMovieHumanBodyPreparation.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Explicit production preparation adds actual head/eye and whole bind metadata to the same original context.

## @evidence contracts/development/design.md#principled-representation `neckConnection`: Actual completed receiver boundary, requested only by production or legacy body consumers. `seat`: Same original cut's legacy support interpretation. `head`: Actual prepared head, requested by complete.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyPreparation.of, AutoMovieHumanBodyPreparation.complete.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `neckConnection`, `seat`, `head`, `standing`, `trunkPlacement`, `anatomy`; callers supply the complete record.
