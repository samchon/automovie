# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut

## @evidence contracts/development/common.md#meaningful-documentation

The section returned for one requested station, with raw chains, enclosing loops, support points and quality findings. Extrema may share crossing tuples and the envelope may reuse raw loop points.

## @evidence contracts/development/design.md#principled-representation

Outline treats on-plane vertices as above, records distinct crossed mesh edges, and bridges compatible chain ends only when forming its envelope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result reports raw and envelope topology, so callers can choose whether to use a bridged boundary. The input mesh and frame stay with the caller.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.station

## @evidence contracts/development/common.md#meaningful-documentation

The supplied distance in millimetres along the selected frame axis, echoed in caller order.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.count

## @evidence contracts/development/common.md#meaningful-documentation

Number of distinct crossed mesh edges, keyed by original endpoint ordinals. Coincident crossings on different edges can count separately.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.loops

## @evidence contracts/development/common.md#meaningful-documentation

Raw oriented closed loops and open chains before envelope bridging. The raw chain order follows crossed triangle winding.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.outer

## @evidence contracts/development/common.md#meaningful-documentation

Closed enclosing pieces after bridge admission, in decreasing enclosed area. Nested pieces are excluded, while disjoint envelopes remain separate.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.extremes

## @evidence contracts/development/common.md#meaningful-documentation

Open crossings, inserted bridges longer than 1e-9 mm, remaining unclosed chains and sampled reach jumps. Reach jumps compare each interior station with the arithmetic mean of its previous and next returned reaches.

# src/geometry/IAutoMovieMeshSectionCut.ts#IAutoMovieMeshSectionCut.flags

## @evidence contracts/development/common.md#meaningful-documentation

Open crossings, inserted bridges, remaining unclosed chains and sampled reach jumps. Reach jumps compare each interior station with the arithmetic mean of its previous and next returned reaches.
