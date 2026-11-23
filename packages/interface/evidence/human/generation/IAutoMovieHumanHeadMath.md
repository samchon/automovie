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
