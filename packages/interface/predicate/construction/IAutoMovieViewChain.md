# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The comment states cardinality and field alignment, coordinates, ordering and closure.

## @evidence contracts/development/design.md#principled-representation

ViewChain.of pairs each point with the next, solves the two tangent lines and checks positive tangent reach and angular advance before admitting the arcs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input exposes just the point, tangent and shoulder controls. The chain derives arc weights, joins and ray spans.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IInput.points

## @evidence contracts/development/common.md#meaningful-documentation

The comment fixes the point frame, units and phase order.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IInput.tangents

## @evidence contracts/development/common.md#meaningful-documentation

The comment states how orientation and scale affect the tangent line.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IInput.shoulders

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the closing arc and each share's allowed interval.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IFieldInput

## @evidence contracts/development/common.md#meaningful-documentation

The comment describes the scope of the derivative input and the preserved placement.

## @evidence contracts/development/design.md#principled-representation

ViewChain.primal takes the value of each field control for numeric admission. The jet reader evaluates the resulting chain with the corresponding station-variable controls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type reuses conic field tuples for each scalar, preserving the value-only chain shape through its derived primal input.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IFieldInput.points

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both local coordinates and the station variation carried by each.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IFieldInput.tangents

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies how derivative directions align with points.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IFieldInput.shoulders

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the per-arc role and scalar units.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the local frame, rational geometry and available observations.

## @evidence contracts/development/design.md#principled-representation

ViewChain.of solves the intersection of the forward and incoming tangent lines, converts shoulder to weight and admits strictly advancing phase over the whole arc.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arc retains numeric data used directly by the ray inverse and preserves endpoint curvature for detecting sided joins.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.start

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the first control and ownership.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.control

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the derived corner of the arc control polygon.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.end

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the final control and closure behavior.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.weight

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the exact relationship to the source field.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.span

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the ordered angular interval used by lookup.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc.curvature

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives unit, order and sign convention.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IJoin

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the two sides and explains the result at a join.

## @evidence contracts/development/design.md#principled-representation

ViewChain.of records the previous arc's end curvature and the next arc's start curvature. Read chooses the arc starting at the requested join phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compact pair exposes a sided second-derivative boundary without changing the chain's common point or tangent.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IJoin.phase

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the join's lookup coordinate.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IJoin.before

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the preceding side of the join.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IJoin.after

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the following side of the join.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains retained inputs and structural outcomes of admission.

## @evidence contracts/development/design.md#principled-representation

ViewChain.of returns either one fully validated arc sequence and its actual curvature joins or a fault record with empty observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One prepared chain supports phase queries without repeating its tangent solves or star-shape checks.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection.input

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the input lifetime.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection.arcs

## @evidence contracts/development/common.md#meaningful-documentation

The comment states array alignment and the failure state.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection.joins

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the original point index and failure state.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection.fault

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the status reported by the preparation.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the solver coordinates and observable sided-derivative boundary.

## @evidence contracts/development/design.md#principled-representation

ViewChain.read unwraps phase, uses binary search to select the arc and solves its native rational ray equation on [0, 1]. It selects the arc starting at an exact join.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result retains the native parameter and original point together. It can be used without repeating the branch selection.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead.index

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the index space.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the unit arc coordinate from polar phase.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead.point

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the point's frame and numerical origin.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead.sided

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the actual equality-based sided rule.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IReading

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the shared ray provenance, derivative order and coordinate scales.

## @evidence contracts/development/design.md#principled-representation

ViewChain.jets pairs a native chain reading with the selected station-variable arc formula and computes the radial partials at that point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result reuses the field derivative tuple. The reader and sided flag preserve the native angular branch.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IReading.point

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the primal result carried with the station-variable calculation.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IReading.radial

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the tuple order and its independent coordinates.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IReading.sided

## @evidence contracts/development/common.md#meaningful-documentation

The comment connects the flag to the same branch selected for point evaluation.
