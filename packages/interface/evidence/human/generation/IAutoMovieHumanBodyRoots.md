# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.PointResult

## @evidence contracts/development/common.md#meaningful-documentation

Chart point and derivative of a root loop at loop parameter u; with a winding, the phase turns once with u round the base's cap pole.

## @evidence contracts/development/design.md#principled-representation

Chart point and derivative of a root loop at loop parameter u; with a winding, the phase turns once with u round the base's cap pole. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.PointResult is the canonical exchange used by AutoMovieHumanBodyRoots.point.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.point for chart point and derivative of a root loop at loop parameter u; with a winding, the phase turns once with u round the base's cap pole.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.PolygonResult

## @evidence contracts/development/common.md#meaningful-documentation

The loop sampled at n uniform parameters, `[s, t]` per sample.

## @evidence contracts/development/design.md#principled-representation

The loop sampled at n uniform parameters, `[s, t]` per sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.PolygonResult is the canonical exchange used by AutoMovieHumanBodyRoots.polygon.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.polygon for the loop sampled at n uniform parameters, `[s, t]` per sample.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.BeyondLoop

## @evidence contracts/development/common.md#meaningful-documentation

Whether a chart point lies beyond a loop winding round the cap pole, toward the pole (`toward` +1 for a top pole, -1 for a bottom one): its station past the loop's station at its phase, interpolated between the loop's samples ordered by phase.

## @evidence contracts/development/design.md#principled-representation

Whether a chart point lies beyond a loop winding round the cap pole, toward the pole (`toward` +1 for a top pole, -1 for a bottom one): its station past the loop's station at its phase, interpolated between the loop's samples ordered by phase. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.BeyondLoop is the canonical exchange used by AutoMovieHumanBodyRoots.beyond.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.beyond for whether a chart point lies beyond a loop winding round the cap pole, toward the pole (`toward` +1 for a top pole, -1 for a bottom one): its station past the loop's station at its phase, interpolated between the loop's samples ordered by phase.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.StationLoop

## @evidence contracts/development/common.md#meaningful-documentation

A winding loop's station at a phase, between its samples ordered by phase.

## @evidence contracts/development/design.md#principled-representation

A winding loop's station at a phase, between its samples ordered by phase. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.StationLoop is the canonical exchange used by AutoMovieHumanBodyRoots.station.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.station for a winding loop's station at a phase, between its samples ordered by phase.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.InsideLoop

## @evidence contracts/development/common.md#meaningful-documentation

Whether a chart point lies inside a loop polygon.

## @evidence contracts/development/design.md#principled-representation

Whether a chart point lies inside a loop polygon. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.InsideLoop is the canonical exchange used by AutoMovieHumanBodyRoots.inside.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.inside for whether a chart point lies inside a loop polygon.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.JoinHoleCharts

## @evidence contracts/development/common.md#meaningful-documentation

Join an appendage to its base: the strip from the appendage's end ring to the root loop, and the zipper from the loop to the base's hole.

## @evidence contracts/development/design.md#principled-representation

Join an appendage to its base: the strip from the appendage's end ring to the root loop, and the zipper from the loop to the base's hole. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.JoinHoleCharts is the canonical exchange used by AutoMovieHumanBodyRoots.join.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.join for join an appendage to its base: the strip from the appendage's end ring to the root loop, and the zipper from the loop to the base's hole.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.TrimHeights

## @evidence contracts/development/common.md#meaningful-documentation

Chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain.

## @evidence contracts/development/design.md#principled-representation

Chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.TrimHeights is the canonical exchange used by AutoMovieHumanBodyRoots.trim.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.trim for chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain.

# src/human/generation/IAutoMovieHumanBodyRoots.ts#IAutoMovieHumanBodyRoots.TrimResult

## @evidence contracts/development/common.md#meaningful-documentation

Chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain.

## @evidence contracts/development/design.md#principled-representation

Chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyRoots.TrimResult is the canonical exchange used by AutoMovieHumanBodyRoots.trim.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyRoots.trim for chart points of a chain whose surface points project along an opening's forward axis onto each point of its projected outline: the opening's trim loop on that chain.
