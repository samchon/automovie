# src/sport/sprintStartSetHands.ts#sprintStartSetHands.frame

## @evidence contracts/development/implementation.md#principled-implementation

Inverts the stand's own placement of its feet from its floor point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One midpoint less one turned rest offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The frame follows the entry's displayed feet, not its root.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the entry's feet and the body's rest once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh frame.

## @evidence contracts/development/common.md#meaningful-documentation

States the construction and the line's place.

# src/sport/sprintStartSetHands.ts#sprintStartSetHands.IBridge

## @evidence contracts/development/design.md#principled-representation

Two fit targets on the hand bone and a world seed wrist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The targets the fit holds and the wrist the seed reaches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The palm carries no target: it rises where the fit leaves it.

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

# src/sport/sprintStartSetHands.ts#sprintStartSetHands

## @evidence contracts/development/implementation.md#principled-implementation

Reads the bridge hand's own pad offsets and lays them on the floor along the line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two offsets, two floor points and one seed point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No palm target and no rotation: the bridge's tilt is the fit's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the hand's offsets once per hand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the result and its units.
