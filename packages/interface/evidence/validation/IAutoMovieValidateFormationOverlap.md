# src/validation/IAutoMovieValidateFormationOverlap.ts#IAutoMovieValidateFormationOverlap

## @evidence contracts/development/common.md#meaningful-documentation

Runtime model and cue population used by sampled formation-overlap admission. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Tier references are model ids while placement and occupied columns use metre geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The overlap gate projects runtime tier identity onto canonical placement and cue records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing columns and sampling limits are omissions, not guessed collision envelopes.

# src/validation/IAutoMovieValidateFormationOverlap.ts#IAutoMovieValidateFormationOverlap.IValue

## @evidence contracts/development/common.md#meaningful-documentation

Defines member/time limits, tier clearance, omitted geometry, borrowed inputs, cache premise and fresh diagnostics.

## @evidence contracts/development/design.md#principled-representation

Existing world-metre placement and model-column contracts meet through exact runtime model ids; cue clocks use shot-relative seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The projection adds only each tier's runtime model identity needed to measure occupied columns, without a renderer or native collision world.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported tier geometry is skipped rather than replaced by guessed size; no findings cannot certify all members, all times or every possible LOD collision.
