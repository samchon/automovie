# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain

## @evidence contracts/development/common.md#meaningful-documentation

States interpolation modes, mm/radian units, immutable callable sources and unverified pole/phase fidelity.

## @evidence contracts/development/design.md#principled-representation

Represents Read a chain from its immutable principal values and explicit interpolation/source data: companion namespace of 18 members (`coefficients`, `derivative`, `bracket`, `lift`, `Pick`, `sectionArrays`, ...); units and frames named in its text: second, frame, world, radians, radian. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieLoftChain` in packages/engine/src/geometry/construction/AutoMovieLoftChain.ts; its surface is the 18 members listed and the text shows 96 other files naming it, mostly packages/human (61), test (26), packages/engine (9), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.coefficients

## @evidence contracts/development/implementation.md#principled-implementation

Reads the declared coefficient interpolant in the existing regular layer domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Combines endpoint arrays once; explicit capped data selects parameter weights.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves ordinary Hermite arithmetic and rejects out-of-domain stations; source curves are not claimed reproduced universally.

## @evidence contracts/development/common.md#meaningful-documentation

Returns basis-layout values in mm.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) output plus binary bracketing and fixed parameter weights.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses stored endpoint parameter/station derivatives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh row and retains no query.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.derivative

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the same coefficient interpolant by the declared physical chain rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses the same span/value owner as coefficients.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not replace a pole derivative by a finite value or change the existing regular-domain bound.

## @evidence contracts/development/common.md#meaningful-documentation

Returns first coefficient derivatives per mm.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) output plus binary bracketing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses prepared endpoint derivatives and shared span weights.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh row without retained query state.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.bracket

## @evidence contracts/development/implementation.md#principled-implementation

Binary-searches strictly increasing principal stations in the existing owned layer interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interval convention also owns the top layer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original 1e-9 boundary allowance and outside-range failure; no new pole domain is inferred.

## @evidence contracts/development/common.md#meaningful-documentation

States sorted nonempty layer premises and last-interval ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log L) comparisons and constant output storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All station readers share this bracket convention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two indices and retains no layer.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.lift

## @evidence contracts/development/implementation.md#principled-implementation

Interpolates actual lift data in physical station with the existing cubic/quintic rule and zero absent rows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One nullable row separates no lift from a prepared lift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not reparameterize lift by the capped coefficient map or invent a displacement.

## @evidence contracts/development/common.md#meaningful-documentation

Returns mm lift values, null only when no layer has lift.

## @evidence contracts/development/implementation.md#efficient-algorithms

One layer-presence scan and O(N) interpolation/output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sampler reuses a prepared lift across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned lift rows belong to the caller; no module retention.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.frame

## @evidence contracts/development/implementation.md#principled-implementation

Validated original caps and matching valid row-axis records read their actual axis; other boundaries retain the existing Hermite/rotation frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frame owner holds source selection and every fallback together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Stale/stripped source records throw; numerical fallback is not called an exact RMF jet.

## @evidence contracts/development/common.md#meaningful-documentation

States original retained cap, regular-domain and copied-continuation boundary behavior; coefficient means/controls remain principal-domain statistics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cap ownership validates O(K+N) source/row snapshots; ordinary queries use binary bracketing and constant frame work or the actual axis query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the immutable prepared actual axis when declared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned frame without a query cache here.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.axis

## @evidence contracts/development/implementation.md#principled-implementation

Places the basis coefficient mean in the same frame and adds mean lift along v-cross-u.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Centroid, source frame and lift use the same station definition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the existing coefficient mean and unnormalized frame-normal convention.

## @evidence contracts/development/common.md#meaningful-documentation

Returns the central-axis point in world mm.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) coefficient/mean/lift work plus frame evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same coefficient and lift readers as surface points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh world triple and retains nothing.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.section

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the unchanged harmonic or periodic cubic phase basis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant chooses the existing basis owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no phase representation, control layout or normalization.

## @evidence contracts/development/common.md#meaningful-documentation

Returns in-plane value and first phase derivative in mm/radian units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Existing basis cost follows order; cubic spline support is local.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumes supplied prepared coefficients without another station interpolation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh fixed tuple without retained coefficients.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.center

## @evidence contracts/development/implementation.md#principled-implementation

Reads harmonic constants or the exact control mean of a periodic spline.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One basis branch owns the centroid convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not fit a centre to emitted points or triangles.

## @evidence contracts/development/common.md#meaningful-documentation

Returns local x/z mean in mm.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) spline summation or constant harmonic reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumes the already prepared coefficient row.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two numbers and keeps no source.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.local

## @evidence contracts/development/implementation.md#principled-implementation

Delegates world-to-plane coordinate reading to the existing frame convention at the same station.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame preparation is shared across the point list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not renormalize a fitted frame or silently repair its metric.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs and returned coordinates use world/local mm; admitted-frame premises remain with its producer.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) point work plus one station frame query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses one frame for every supplied point.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh local pairs and retains no point list.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.ring

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same value sampler for every requested phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One station preparation feeds the ring map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes neither phase correspondence nor the point definition.

## @evidence contracts/development/common.md#meaningful-documentation

Stations use mm and phases radians; returns world-mm points.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sampler preparation plus local phase support per point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses coefficients, source frame and lift across all phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh ring vectors; sampler lifetime ends with the call.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.sampler

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the same value-only point definition to its point owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public API stays in LoftChain while point preparation has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No alternative geometry or phase evaluator is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable source and physical station units; retained cap Point0 does not imply physical2 at its collapsed tip.

## @evidence contracts/development/implementation.md#efficient-algorithms

The point owner prepares O(N) arrays once for repeated phase calls.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned closure reuses its one station preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Caller release ends the returned closure's retained station lifetime.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.phaseSampler

## @evidence contracts/development/implementation.md#principled-implementation

Delegates source/basis value and phase differentiation to the same point owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin adapter serves callers whose station derivative remains numerical.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Present source data never routes through compatibility coefficients or missing station jets.

## @evidence contracts/development/common.md#meaningful-documentation

Uses principal or explicitly retained cap stations in mm and phase radians; unavailable phase derivatives still fail and world outputs are fresh.

## @evidence contracts/development/implementation.md#efficient-algorithms

Costs follow the point owner's actual local field/frame/lift preparation and phase reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned closure reuses one station preparation across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Caller release ends this closure's lifetime independently of Point/Jet module caches.

# src/geometry/construction/AutoMovieLoftChain.ts#AutoMovieLoftChain.point

## @evidence contracts/development/implementation.md#principled-implementation

Delegates single-point evaluation to the original point owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public chain API keeps its original signature.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the Hermite interpolation arithmetic and returns a fresh vector.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable chain identity, mm station and radian phase.

## @evidence contracts/development/implementation.md#efficient-algorithms

After finding the station bracket, a spline phase combines only its four control positions per coordinate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers with multiple phases at one station use the fixed-station sampler.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One point query owns its temporary station plan and returns a fresh vector.
