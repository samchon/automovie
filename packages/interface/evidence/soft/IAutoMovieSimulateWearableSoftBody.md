# src/soft/IAutoMovieSimulateWearableSoftBody.ts#IAutoMovieSimulateWearableSoftBody.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines inclusive fixed-step history, slot admission, rigid offsets, default state, result ownership and propagated failures.

## @evidence contracts/development/design.md#principled-representation

Frames carry world-metre poses at absolute domain steps; safe integer coverage and subject bounds are checked by simulateAutoMovieWearableSoftBody, while general domain validity remains separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses canonical domain and wearable frame contracts; slot and ceiling are explicit inputs because the resolver does not own a global live-subject registry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Complete snapshots replace hidden motion callbacks or interpolated missing frames; the budget slot admits this call without proving global slot uniqueness.
