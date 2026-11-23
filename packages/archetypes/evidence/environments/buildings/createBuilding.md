# src/environments/buildings/createBuilding.ts#createBuilding

## @evidence contracts/development/implementation.md#principled-implementation

The shared triangulator checks room regions; split plan edges and certified aperture dimensions drive the assembled graph and geometry. Placed building support requires unit scale and vertical world Y.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan admission and lowering are separate so reused plans share the same input and every instance has its own geometry identifiers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-upright transformation refuses before support construction. No plan or room name switches behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan preprocessing and mesh construction belong to their respective owners. The placement gate adds constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Admitted local plans are shared by all placements of this definition; results and world frames are independently constructed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller's reusable function retains only the normalized plan and scalar construction options; each placement returns separately owned records.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the source choices, reuse, metre coordinates, anchor identities and orientation, and refusal conditions.
