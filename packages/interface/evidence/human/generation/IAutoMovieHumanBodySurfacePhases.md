# src/human/generation/IAutoMovieHumanBodySurfacePhases.ts#IAutoMovieHumanBodySurfacePhases

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanBodySurfacePhases exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ArcVerticesArc. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanBodySurfacePhases; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ArcVerticesArc contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanBodySurfacePhases.ts#IAutoMovieHumanBodySurfacePhases.ArcVerticesArc

## @evidence contracts/development/common.md#meaningful-documentation

Ring vertices whose phases lie on a forward arc, inclusive, in ring order.

## @evidence contracts/development/design.md#principled-representation

Ring vertices whose phases lie on a forward arc, inclusive, in ring order. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodySurfacePhases.ArcVerticesArc is the canonical exchange used by AutoMovieHumanBodySurfacePhases.arcVertices.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodySurfacePhases.arcVertices for ring vertices whose phases lie on a forward arc, inclusive, in ring order.
