# src/human/generation/IAutoMovieHumanTrunkKeys.ts#IAutoMovieHumanTrunkKeys

## @evidence contracts/development/common.md#meaningful-documentation

The fold, bust, waist and high-hip landmark heights moved by trunk courses. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only Heights declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

Heights separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanTrunkKeys exchanges the named Heights contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanTrunkKeys.ts#IAutoMovieHumanTrunkKeys.Heights

## @evidence contracts/development/common.md#meaningful-documentation

The landmark heights the courses move.

## @evidence contracts/development/design.md#principled-representation

The landmark heights the courses move. Record<"fold" | "bust" | "waist" | "highHip", number> retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkKeys.heights. Also types AutoMovieHumanTrunkClosure.h, AutoMovieHumanTrunkKeys.h.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkClosure.h, AutoMovieHumanTrunkKeys.heights, AutoMovieHumanTrunkKeys.h, AutoMovieHumanTrunkSolver.h for the landmark heights the courses move.
