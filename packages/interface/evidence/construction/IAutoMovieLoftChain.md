# src/construction/IAutoMovieLoftChain.ts#IAutoMovieLoftChain

## @evidence contracts/development/design.md#principled-representation

Principal values, station jets and optional explicit axis/parameter source records determine every reading; no hidden bind registry changes geometry. Layers keep physical station, local section values and world frame data distinct; the phase sampler differentiates only its radian correspondence coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record of layers and the chain's basis, order, rule, samples and poles. Chain construction publishes layer/view records and AutoMovieLoftChain.phaseSampler exposes the callback implemented by LoftPoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional jets are absent rather than zero-filled, so a reader knows which rule applies. Optional source/derivative fields retain explicit absence rather than implying a numerical zero or an admitted regular surface.

## @evidence contracts/development/common.md#meaningful-documentation

States field units, absence, actual-axis ownership, numeric-copy equivalence, immutable cache premises and callable-source serialization limits. Members state derivative units, frame/source ownership, raw view meaning and callback lifetime.

# src/construction/IAutoMovieLoftChain.ts#IAutoMovieLoftChain.ILayer

## @evidence contracts/development/design.md#principled-representation

Values and station jets define ordinary Hermite spans; optional common pole-coordinate derivatives and actual-axis records state the supported source interpolation directly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Section, lift, frame and their derivative/source fields remain one immutable layer datum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing jets are not zero-filled, invalid retained axis data is not silently resplined and source metadata is explicitly removed or transformed at a changed boundary.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish mm station derivatives, parameter derivatives, raw view metadata and the callable source's lifetime/copy limits.

# src/construction/IAutoMovieLoftChain.ts#IAutoMovieLoftChain.IView

## @evidence contracts/development/design.md#principled-representation

Box, shoulders and guide curvatures describe the admitted section before final phase/station interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three four-entry arrays preserve the section owner's quantities without another shape representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Raw conic data does not certify final Cartesian spline fidelity, convexity or geometric G2 at a pole.

## @evidence contracts/development/common.md#meaningful-documentation

Members state signed directions, quarter indexing and mm/inverse-mm units.

# src/construction/IAutoMovieLoftChain.ts#IAutoMovieLoftChain.IPhaseSamplerResult

## @evidence contracts/development/design.md#principled-representation

Position and first phase partial belong to the same world field at fixed physical station; neither is a station derivative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

LoftChain and LoftPoint share this prepared callback and the common world phase reading, without a second sampler contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unavailable physical station derivatives are not filled with zeros and stale present source data does not select a legacy fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Defines radian input, world output units, retained immutable preparation, caller ownership and thrown failures.
