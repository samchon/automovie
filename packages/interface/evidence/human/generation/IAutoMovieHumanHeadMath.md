# src/human/generation/IAutoMovieHumanHeadMath.ts#IAutoMovieHumanHeadMath

## @evidence contracts/development/common.md#meaningful-documentation

Describes planar section coordinates and convex-gauge ray readers used by head geometry; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Planar section coordinates and convex-gauge ray readers used by head geometry. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHeadMath; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HeadMath contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanHeadMath.ts#IAutoMovieHumanHeadMath.P2

## @evidence contracts/development/common.md#meaningful-documentation

A point of a section.

## @evidence contracts/development/design.md#principled-representation

A point of a section. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid. Read by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid, AutoMovieHumanHeadMath.lifted.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadMath.mix, AutoMovieHumanHeadMath.centroid, AutoMovieHumanHeadMath.lifted for a point of a section.

# src/human/generation/IAutoMovieHumanHeadMath.ts#IAutoMovieHumanHeadMath.OutermostH

## @evidence contracts/development/common.md#meaningful-documentation

Convex-gauge value h(r) along the caller's ray, with boundary h(r)=1. The physical unit of r follows that ray; the caller's outermost-root algorithm relies on convexity and may report no intersection.

## @evidence contracts/development/design.md#principled-representation

Convex-gauge value h(r) along the caller's ray, with boundary h(r)=1. The physical unit of r follows that ray; the caller's outermost-root algorithm relies on convexity and may report no intersection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadMath.OutermostH is the canonical exchange used by AutoMovieHumanHeadMath.outermost.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanHeadMath input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
