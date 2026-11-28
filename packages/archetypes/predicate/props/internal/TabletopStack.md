# src/props/internal/TabletopStack.ts#TabletopStack.contacts

## @evidence contracts/development/common.md#meaningful-documentation

Locates grip and socket frames and defines the height and aperture units.

## @evidence contracts/development/implementation.md#principled-implementation

The bottom and top sockets share the vertical stacking axis. The pinch uses the exact width picked by the calling prop and its upper face position.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates three fixed frames from the supplied height and aperture.

# src/props/internal/TabletopStack.ts#TabletopStack.Contact

## @evidence contracts/development/common.md#meaningful-documentation

Names the grip and both ends of the shared stacking axis.

## @evidence contracts/development/design.md#principled-representation

The bottom and upper sockets define where adjacent objects mount and the pinch controls pickup.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three action sites are the exact common keys used by all tabletop callers.
