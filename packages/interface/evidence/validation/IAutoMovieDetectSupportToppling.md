# src/validation/IAutoMovieDetectSupportToppling.ts#IAutoMovieDetectSupportToppling

## @evidence contracts/development/common.md#meaningful-documentation

Static support-hull facts supplied to the toppling adviser. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

World metre geometry and a horizontal margin define one static support query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support adviser joins existing hull geometry to canonical event/toppling results.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A static hull query is not a dynamic simulation or complete stability proof.

# src/validation/IAutoMovieDetectSupportToppling.ts#IAutoMovieDetectSupportToppling.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines frame, support predicate, defaults, admission limits and borrowed pivot ownership.

## @evidence contracts/development/design.md#principled-representation

World metre points and a metre margin determine horizontal overhang; canonical vector records preserve the full points for reporting the pivot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The adviser reuses hull and segment geometry and returns canonical support advice without a physical simulator or actor-state owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty support is refused rather than fabricated; physicsIntent suppresses advice while preserving the event, and no dynamic-stability verdict is implied.
