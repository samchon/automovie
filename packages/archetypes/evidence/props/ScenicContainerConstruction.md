# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.BasketsKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of baskets.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only baskets and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.BasketsContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of baskets.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only baskets and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.baskets

## @evidence contracts/development/common.md#meaningful-documentation

Build a lidded coil basket or an open fish basket.

## @evidence contracts/development/implementation.md#principled-implementation

The coil basket's closed lid and the fish basket's clear floor each supply the footprint supported by their own geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The two documented coarse silhouettes retain their covered-top or open-bottom contracts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each basket uses a fixed number of cells.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.closedCoffer

## @evidence contracts/development/common.md#meaningful-documentation

Build a closed plank coffer with a stacking footprint on its lid.

## @evidence contracts/development/implementation.md#principled-implementation

The lid's supported top spans the measured rectangular outline.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The coarse closed construction retains the same supported footprint and geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four boxes and one contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.openCrate

## @evidence contracts/development/common.md#meaningful-documentation

Build an open molded crate with a stacking footprint inside the rim.

## @evidence contracts/development/implementation.md#principled-implementation

The ribbed walls surround a clear interior over the physical floor. The placement rectangle ends before the walls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The earlier illustrative molded crate dimensions and sparse rails are reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of ribs and rails.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.scenicPod

## @evidence contracts/development/common.md#meaningful-documentation

Replay the scenic cargo pod with its cap stacking footprint.

## @evidence contracts/development/implementation.md#principled-implementation

Three faceted sections taper to the cap. The footprint is entirely on that cap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The legacy appearance and single stacking contact replay exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three solids with at most sixteen corners each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the historical selector calls this construction. It shares the pod geometry and draw namespace with mountedPod.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.MountedPodContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of mountedPod.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only mountedPod and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/ScenicContainerConstruction.ts#ScenicContainerConstruction.mountedPod

## @evidence contracts/development/common.md#meaningful-documentation

Build a cargo pod with both a stacking cap and a lower mounting socket.

## @evidence contracts/development/implementation.md#principled-implementation

Three faceted sections follow the saved size. The mounting origin lies on the base face and its +Y axis is up.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The added socket is an authoring frame only. No fastener or extra shape is drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three solids and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the named producer calls this construction. It shares the pod geometry and draw namespace with scenicPod, so both paths give the same parts at a seed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.
