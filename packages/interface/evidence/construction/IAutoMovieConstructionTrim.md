# src/construction/IAutoMovieConstructionTrim.ts#IAutoMovieConstructionTrim

## @evidence contracts/development/design.md#principled-representation

A trim as a curve in the surface's parameter domain keeps the opening watertight with its neighbours through shared parameter curves (Sederberg et al., Watertight trimmed NURBS, 2008), with no clip of a mesh by position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A host subtree, a face name and the margin's landmarks are the whole record; lining and rim are further nodes joined to the face.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed margin leaves the face closed and reported, never an opening cut by position.

## @evidence contracts/development/common.md#meaningful-documentation

States the cut's nature, the loop's construction, its failure effect and the admission rules.
