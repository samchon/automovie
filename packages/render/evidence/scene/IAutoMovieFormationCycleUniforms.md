# src/index.ts#IAutoMovieFormationCycleUniforms

## @evidence contracts/development/design.md#principled-representation

Mutable Three uniform cells carry the active baked texture, its sample/row dimensions and shared travel/turn phases to every material without changing per-member instance data.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed shader-facing cell names match applyFormationCycleCadence writes and formation cycle shader reads, keeping one phase source per unit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uniforms contain runtime-selected take and physical cadence quantities rather than a consumer-specific baked answer or frame number.

## @evidence contracts/development/common.md#meaningful-documentation

Members define texture role, sample columns, three affine rows per part and the distinct units of advance and turning.
