# src/furniture/StorageConstruction.ts#StorageConstruction.faces

## @evidence contracts/development/common.md#meaningful-documentation

States the two contacts.

## @evidence contracts/development/implementation.md#principled-implementation

Two surface frames on the cabinet's faces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two affordances.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every kind lays its outer faces through this one function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/StorageConstruction.ts#StorageConstruction.wardrobe

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and which way the doors swing.

## @evidence contracts/development/implementation.md#principled-implementation

Door parts bound to `hinge` affordances on the outer edges, each pull a `handle` riding its hinge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Carcass, then each door with its pull and their two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The carcass is one solid box; the inside is not modelled.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Five parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one cabinet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/StorageConstruction.ts#StorageConstruction.drawers

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, the drawers' numbering and direction.

## @evidence contracts/development/implementation.md#principled-implementation

Equal drawers up the carcass's height, each box as long as the carcass's inside so a drawn drawer stays in its mouth, its slider's travel the drawn one and its frame on the front's middle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Carcass, then each drawer with its contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The carcass is one solid box, so a drawer's box hides in it at rest, without runners or a hollow.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three parts per drawer.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one cabinet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/StorageConstruction.ts#StorageConstruction.locker

## @evidence contracts/development/common.md#meaningful-documentation

States what is built, its one contact and why the door does not open.

## @evidence contracts/development/implementation.md#principled-implementation

The maker's width, depth and height above its 6 in legs; the hat shelf at Penco's 48 in above the bottom; the hinge on the door's `-X` edge at half its height, its axis down so a positive travel would swing the door out toward `+Z`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Legs, walls, door, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No louvres, hooks, handle or lock; the walls' and legs' sections are construction estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one cabinet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/furniture/StorageConstruction.ts#StorageConstruction.bookcase

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and the shelves' numbering.

## @evidence contracts/development/implementation.md#principled-implementation

The maker's size and shelf count, the shelves' tops dividing the height into equal steps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Carcass panels, then each shelf with its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The panels' and the plinth's sizes are construction estimates; the shelves stand at even steps, where the maker lets four of them move.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one cabinet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
