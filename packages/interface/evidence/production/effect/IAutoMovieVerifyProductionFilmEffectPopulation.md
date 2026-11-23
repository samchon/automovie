# src/production/effect/IAutoMovieVerifyProductionFilmEffectPopulation.ts#IAutoMovieVerifyProductionFilmEffectPopulation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States ordering, exact membership, compared identities, empty behavior and the production-id check left to the sampler.

## @evidence contracts/development/design.md#principled-representation

The timeline owns the film-frame clock and expected cues; the readonly runtime array preserves persisted order for verification. Engine runtime validation checks shape, digests and equality.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One timeline and one population supply every value read by verifyProductionFilmEffectPopulation; both remain caller-owned.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A population is not an arbitrary valid subset: missing, duplicate, extra and reordered entries fail; production identity cannot be proven from this timeline alone.
