# src/sport/createPoolWater.ts#createPoolWater

## @evidence contracts/development/implementation.md#principled-implementation

Both the two upward-facing triangles and the water affordance derive from the same rectangular dimensions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit or draw two spans and use them in one archetype with one material, one mesh and one placement reference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The draw session preserves fixed dimensions inside their bands. The open mesh contributes no body or motion colliders.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four vertices and two triangles are sufficient at every admitted size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted spans supply both the mesh and the water reference. Color conversion and the rigid affordance frame use their existing owners.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned model owns its fresh data. The producer retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

Names the local plane, dimensions, material and water reference.
