# src/human/generation/leg/IAutoMovieHumanLegSources.ts#IAutoMovieHumanLegSources

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegSources exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IOutput, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegSources; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IOutput, IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegSources.ts#IAutoMovieHumanLegSources.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Prejoin originals and the honest explicit coupled-parent seam.

## @evidence contracts/development/design.md#principled-representation `leg`: The same call-owned leg family used by production's eventual bind. `bones`: Actual shared rest joints used by the same original source. `law`: Original leg law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegSources.create. Also types AutoMovieHumanLimbSources.legs, AutoMovieHumanLimbSources.previous.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `leg`, `bones`, `law`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegSources.ts#IAutoMovieHumanLegSources.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Public inputs and their directly generated rest/attachment datum.

## @evidence contracts/development/design.md#principled-representation `side`: Canonical source side. `rest`: Actual rest joints and local foot centres, before any skin. `feet`: Sided public foot dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegSources.create. Also types AutoMovieHumanLegSources.side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Explicit full-parent demand; ordinary ankle/foot/original reads do not call it.
