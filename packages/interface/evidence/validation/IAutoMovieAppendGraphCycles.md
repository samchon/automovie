# src/validation/IAutoMovieAppendGraphCycles.ts#IAutoMovieAppendGraphCycles

## @evidence contracts/development/common.md#meaningful-documentation

Ordered graph projection consumed by the common directed-cycle reporter. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

Text ids and ordered outgoing references are separate from raw diagnostic path/value payloads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Lineage and hierarchy validators project their records for one common cycle traversal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cycle detection does not replace shape, uniqueness or dangling-reference admission.

# src/validation/IAutoMovieAppendGraphCycles.ts#IAutoMovieAppendGraphCycles.INodes

## @evidence contracts/development/common.md#meaningful-documentation

Defines traversal, reporting ownership, dangling/duplicate behavior and collector failure effects.

## @evidence contracts/development/design.md#principled-representation

Stable text ids define graph identity while path/value retain the caller's diagnostic location and raw evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Revision lineage and building hierarchy validators project their existing records into this graph without transferring their domain models.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

unknown is intentional diagnostic payload, not an admitted graph value; shape, uniqueness and dangling-link checks remain outside this cycle-only operation.
