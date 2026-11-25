# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.ILayout

## @evidence contracts/development/common.md#meaningful-documentation

The anchors of a section family.

## @evidence contracts/development/design.md#principled-representation `anchors`: Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. `mirror`: Reflect the listed half in the median line `v = 0`. `least`: Least shoulder an arc of this family takes; absent, only the model's edge bound holds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanConicSection.limb, AutoMovieHumanConicSection.lens, AutoMovieHumanConicSection.bilateral. Read by AutoMovieHumanConicSection.featured, AutoMovieHumanConicSection.convert, AutoMovieHumanConicSection.units. Also types AutoMovieHumanConicLoft.twinLayout, AutoMovieHumanConicSection.layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `least`: Least shoulder an arc of this family takes; absent, only the model's edge bound holds.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IAnchor

## @evidence contracts/development/common.md#meaningful-documentation

One anchor of a layout.

## @evidence contracts/development/design.md#principled-representation `kind`: The tangent rule, as the namespace describes. `mid`: A `u` anchor on the median line `v = 0`. `guide`: One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanConicLoft.anchors, AutoMovieHumanConicLoft.anchor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `mid`: A `u` anchor on the median line `v = 0`. `guide`: One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. `level`: Nesting level of an `m` or `i` anchor, 1 when absent: its neighbours are the nearest anchors of a lower level. `feature`: The feature line an `f` anchor stands on, for its seed and its record; generation does not read it. `window`: Phase window in radians where an observation of this `u`, `v` or `f` anchor is sought; generation does not read it. `pick`: Whether an observation takes the window's largest or smallest coordinate; generation does not read it.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.Unit

## @evidence contracts/development/common.md#meaningful-documentation

What a field measures: millimetres, a share in (0, 1), or an angle in radians.

## @evidence contracts/development/design.md#principled-representation

What a field measures: millimetres, a share in (0, 1), or an angle in radians. The closed alternatives are "mm", "share", "angle".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanConicSection.units. Also types AutoMovieHumanConicSection.out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicSection.units, AutoMovieHumanConicSection.out for what a field measures: millimetres, a share in (0, 1), or an angle in radians.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IChain

## @evidence contracts/development/common.md#meaningful-documentation

The closed chain of a field vector with the positions of the engine's four guides in it.

## @evidence contracts/development/design.md#principled-representation `input`: The native chain input: points, tangents and shoulders in increasing phase. `guides`: Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanConicSection.resolve. Also types AutoMovieHumanConicLoft.resolved, AutoMovieHumanConicLoft.chain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `input`, `guides`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IFeatureRun

## @evidence contracts/development/common.md#meaningful-documentation

One run of feature anchors inserted after an anchor of a base layout (`featured`).

## @evidence contracts/development/design.md#principled-representation `after`: Index in the base layout's anchors after which the run stands. `anchors`: The feature anchors (`f`), in increasing phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanConicSection.featured, AutoMovieHumanConicSection.convert.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `after`, `anchors`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IOffsetsResult

## @evidence contracts/development/common.md#meaningful-documentation

Offsets of every anchor's first field, and the offset of the first shoulder.

## @evidence contracts/development/design.md#principled-representation `at`: Start index of each anchor's shape values in the packed section vector. `shoulders`: Start index of the conic-shoulder values following the anchor fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicSection.IOffsetsResult is the canonical exchange used by AutoMovieHumanConicSection.offsets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `shoulders`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.FrameResult

## @evidence contracts/development/common.md#meaningful-documentation

The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout).

## @evidence contracts/development/design.md#principled-representation

The two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout). Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicSection.FrameResult is the canonical exchange used by AutoMovieHumanConicSection.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicSection.frame for the two extremes a feature anchor `k` stands between: the nearest `u` or `v` anchor before it and the nearest after it, in the layout's order (round the end of the list for a closed layout).

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

A feature point on the chord from `p0` to `p2`: at `t` of the way along it, the offset `o` square to it, millimetres outward (to the right of travel, which is outward on a counter-clockwise section), and its tangent the chord's direction turned by `h` radians.

## @evidence contracts/development/design.md#principled-representation `point`: Placed feature point in the local section chart, millimetres. `tangent`: Feature tangent direction in the local section chart; its turn is relative to the anchor chord.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicSection.IPlaceResult is the canonical exchange used by AutoMovieHumanConicSection.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `tangent`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.IUnplaceResult

## @evidence contracts/development/common.md#meaningful-documentation

The numbers `[share, o, h]` of a feature point `p` with the tangent heading `heading` on the chord from `p0` to `p2`, the feature before it in the run at `previous` of the way along (`along`, `place`), and how far along the chord `p` itself stands.

## @evidence contracts/development/design.md#principled-representation `values`: Recovered feature controls: chord share, perpendicular offset in millimetres, and tangent turn in radians. `t`: Recovered share along the feature's chord, before subsequent features consume the remaining interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicSection.IUnplaceResult is the canonical exchange used by AutoMovieHumanConicSection.unplace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `values`, `t`; callers supply the complete record.

# src/human/generation/conic/IAutoMovieHumanConicSection.ts#IAutoMovieHumanConicSection.NeighboursResult

## @evidence contracts/development/common.md#meaningful-documentation

The nearest resolved anchors before and after anchor `k`.

## @evidence contracts/development/design.md#principled-representation

The nearest resolved anchors before and after anchor `k`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanConicSection.NeighboursResult is the canonical exchange used by AutoMovieHumanConicSection.neighbours.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanConicSection.neighbours for the nearest resolved anchors before and after anchor `k`.
