# src/skeleton/AutoMovieBodyRegion.ts#AutoMovieBodyRegion

## @evidence contracts/development/design.md#principled-representation

Closed regions classify motion channels for masking and layering, while actual surviving root, bone and expression ownership determines whether concurrent content conflicts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fixed limb/head/face groups keep channel selection explicit; fullBody combines body bones while face owns expressions, and root retention follows the compiler's layering rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Region names alone do not guarantee disjoint content, especially fullBody overlaps; composition must inspect the masked surviving channels rather than permit concurrency by label only.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each region's channels and the fullBody exception requiring actual disjoint surviving content.
