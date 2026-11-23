# src/internal/accessorValues.ts#accessorValues

## @evidence contracts/development/implementation.md#principled-implementation

glTF defines normalized integer decoding per component type, and `Accessor.getElement` applies exactly that, so the helper delegates normalized accessors to it and copies any other accessor verbatim with `Array.from`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper serves node animation import and face template import, the two places that copy accessor data into plain number arrays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-normalized quantized integers are deliberately copied raw because their scale lives in the node transform, and no component type is special-cased beyond glTF's own normalization flag.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states which accessors glTF lets be normalized, the decoding formulas, the raw-copy case and its reason, the result layout, and what `null` means.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in count times element size, with one plain-number result array and one reused element buffer for normalized data; Array.from copies the resident typed array into plain numbers for the non-normalized path.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call creates an independent array; shared animation samplers are deliberately read again per track, and mutable Document data prevents a retained cache without a caller-owned invalidation contract.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The element buffer is released on return; the result array, proportional to the accessor's component count, is owned by the caller and nothing is retained by the helper.
