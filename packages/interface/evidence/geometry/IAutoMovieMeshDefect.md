# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect

## @evidence contracts/development/design.md#principled-representation

Represents one defect of a triangle complex as its kind plus the vertices of its simplex: an edge's two ends or a triangle's three corners. Indices are unitless counts into the measured position buffer. The length of `vertices` follows from `kind` and is not encoded in the type, so a record with the wrong length is ruled out only by its producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine's geometry module beside its producer `measureAutoMovieMeshDefects`. The viewer's inspection instrument reads both members: `kind` selects the colour, the legend entry and the request's filter, and `vertices` gives the segment or triangle to draw.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Edge and triangle defects share one flat record instead of a union discriminated by arity, because every consumer draws `vertices` as one index run whatever its length; the cost is the unenforced length stated above. No member is optional, no type is widened, and the counts of `IAutoMovieMeshTopology` are not repeated here.

## @evidence contracts/development/common.md#meaningful-documentation

States what a defect locates, which buffer the vertex indices address and that they are unwelded, and the length and order of the list per kind.

# src/geometry/IAutoMovieMeshDefect.ts#IAutoMovieMeshDefect.Kind

## @evidence contracts/development/design.md#principled-representation

A closed union of the five classes the edge census and the triangle tests can produce, so a consumer's switch over it is exhaustive and no other string can be written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned with `IAutoMovieMeshDefect`; the producer writes each literal and the viewer's inspection instrument maps each to a colour and a legend entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union does not split edge kinds from triangle kinds into two types, since its consumers handle both through the one record; which kinds are which is stated here instead.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each literal by its incidence or shape condition and says which are edge kinds and which are triangle kinds.
