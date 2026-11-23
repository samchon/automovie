# src/scene/createImportedModelObject.ts#createImportedModelObject

## @evidence contracts/development/implementation.md#principled-implementation

Always adds the supplied loaded root beneath a new runtime group so pose-root TRS does not overwrite the imported root's authored local TRS; normalized semantic bone map drops null/undefined entries and imported bytes have no generated part-id registry. Reparenting uses add, so an already-parented root's previous world placement is not preserved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Adapts one loaded root and optional bone/expression/frame ports into the same model handle as generated assets; loader/byte/native ownership remains with the caller and no duplicate decoded model is built.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Wrapping is uniform for every Object3D class rather than a fixture/instanceof root exception; semantic-map casts rely on admitted keys and no missing bones/parts or expression hooks are fabricated.

## @evidence contracts/development/common.md#meaningful-documentation

Gives loaded-root adaptation and comments explain protected local transform, empty imported part registry and forwarded hooks; bone mapping and adoption remain caller-owned contracts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Allocates one runtime group and copies B present bone-map entries once, O(B) CPU/reference storage without traversing or cloning mesh buffers/materials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses actual decoded root/bone objects and forwards existing hook references; separate placements require separate loaded/cloned native roots because a single object cannot retain multiple parents.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows/adopts loaded graph into one wrapper and retains B bone/hook references with the returned handle; no decoder, worker or GPU allocation is acquired here, and the supplied graph's real owner must retire its resources when this runtime is released.
