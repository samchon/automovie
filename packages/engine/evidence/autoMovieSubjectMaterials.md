# src/autoMovieSubjectMaterials.ts#autoMovieSubjectMaterials

## @evidence contracts/development/implementation.md#principled-implementation

Projects the declared material records to their identity fields and sorts them with the render-id comparator every subject list uses, so the order does not depend on authoring order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One material listing for prototypes, parts, elements and instances, which previously kept a model and a part variant twice over.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No material is special-cased, and an unresolved part material is left out rather than invented.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both modes, the order, and the unresolved and uncited part cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the model's material count plus an O(m log m) sort of the m listed materials.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure projection of one model's records that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned list, one record per listed material, and retains nothing.
