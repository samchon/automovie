# src/sport/createKendoArmour.ts#createKendoArmour

## @evidence contracts/development/implementation.md#principled-implementation

Coarse padded boxes, rods and a shell sized by the drawn width, height and depth, with the struck surfaces placed on the outside of the parts the rules name.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, then one branch per kind with its parts, its wear socket and its struck surfaces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parts do not flex, the grille is one panel and the flaps are rigid; every size is a named estimate, and the struck regions are the rule's names, not scoring logic.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five parts and five affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States each piece's frame as worn, its wear socket and the struck regions with their rule source.
