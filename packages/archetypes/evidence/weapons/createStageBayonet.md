# src/weapons/createStageBayonet.ts#createStageBayonet

## @evidence contracts/development/implementation.md#principled-implementation

Sizes the socket bore from the musket's barrel collider plus a fitting gap, so the tube clears the muzzle it slides over. The socket frame shares the blade's axes, so mating it with the musket's bayonet frame keeps the blade parallel to the bore.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the barrel, then build the socket tube, crank and blade, then the socket, handle and tip frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The blade, socket, crank and wall lengths are named provisional estimates with the record to read. The musket keeps its own geometry and identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one part of a fixed-size model and builds four parts and three contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the generated barrel rather than repeating the musket catalogue.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Does not keep the musket model or any external resource.

## @evidence contracts/development/common.md#meaningful-documentation

Names the blade axis, the socket's place and the three contact frames, and marks the unread proportions.
