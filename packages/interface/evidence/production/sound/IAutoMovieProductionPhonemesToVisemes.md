# src/production/sound/IAutoMovieProductionPhonemesToVisemes.ts#IAutoMovieProductionPhonemesToVisemes

## @evidence contracts/development/common.md#meaningful-documentation

Names the inputs of phoneme timing.

## @evidence contracts/development/design.md#principled-representation

A namespace of the timing inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract engine's `productionPhonemesToVisemes` exposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is declared on the namespace itself.

# src/production/sound/IAutoMovieProductionPhonemesToVisemes.ts#IAutoMovieProductionPhonemesToVisemes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the equal-share rule, the table, the refusals and which checks belong to admission.

## @evidence contracts/development/design.md#principled-representation

The chunks alone: timing is on the samples, so no frame rate or line span is needed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member, read by the mapper.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rates and span are not accepted here, so timing cannot depend on film placement.
