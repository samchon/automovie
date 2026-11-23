# src/human/generation/IAutoMovieHumanTrunkClosure.ts#IAutoMovieHumanTrunkClosure

## @evidence contracts/development/common.md#meaningful-documentation

A callback selecting the reliefs acting at a tape site for a candidate trunk column. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only Reliefs declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

Reliefs separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanTrunkClosure exchanges the named Reliefs contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanTrunkClosure.ts#IAutoMovieHumanTrunkClosure.Reliefs

## @evidence contracts/development/common.md#meaningful-documentation

A function of the column giving the reliefs that act at a tape's site.

## @evidence contracts/development/design.md#principled-representation

A function of the column giving the reliefs that act at a tape's site. The callable takes col and returns IAutoMovieLoftRelief[].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkClosure.girthAt. Also types AutoMovieHumanTrunkClosure.none.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkClosure.girthAt, AutoMovieHumanTrunkClosure.none, AutoMovieHumanTrunkClosure.close for a function of the column giving the reliefs that act at a tape's site.
