# src/render/inspection/IAutoMovieInspectionRequest.ts#IAutoMovieInspectionRequest

## @evidence contracts/development/design.md#principled-representation

One record per picture separates the independent questions an inspection asks, selection, shade, marks and cut, so any combination is one value and the page and the command draw the same request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Planes and passes are the engine's and the interface's own types; the renderer adds the selection patterns, the kind patterns, the two inspection shades, the sliver limit and the stroke width. Kinds are patterns, not a list of known kinds, because producers own them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a subject, a part or a kind of finding, and the sliver limit has no built-in value: a triangle is a sliver only against the aspect the caller states.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it selects or draws, its unit where it has one and what its empty value means.
