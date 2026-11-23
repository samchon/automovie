# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve

## @evidence contracts/development/design.md#principled-representation

A polyline in the construction tree's own frame and unit, metres, with its closure stated instead of a repeated end point, its role as a closed union and its owner by chain name. `flagged` is one bit and does not say which of its two causes applied. The type does not encode that a section is closed and the others open, which its producer keeps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the construction module beside its producer `sampleAutoMovieConstructionCurves`. The viewer's inspection instrument reads every member: `id` names the curve in a refusal, `kind` selects the colour, the legend label and the request's filter, `part` is the name a path pattern selects the chain's curves by, `closed` and `points` are the path, and `flagged` selects the warning colour.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is optional and none is widened. Points are a plain `number[]` because a curve holds a few hundred components and its consumers iterate it once. A left-out sample is not replaced by a neighbour or a zero; it is absent and the curve says so through `flagged`.

## @evidence contracts/development/common.md#meaningful-documentation

States what each kind is, the id grammar, the unit and layout of the points, the closure convention and both causes of a flag.

# src/construction/IAutoMovieConstructionCurve.ts#IAutoMovieConstructionCurve.Kind

## @evidence contracts/development/design.md#principled-representation

A closed union of the three roles a lofted chain's construction lines play, so a consumer's switch over it is exhaustive and no other string can be written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned with `IAutoMovieConstructionCurve`; the producer writes each literal and the viewer's inspection instrument maps each to a colour and a legend entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The quarter of a guide and the layer of a section stay in the curve's `id` instead of multiplying the union into one literal per quarter.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each literal by the curve it names and says which is closed.
