# src/sport/createCueTable.ts#createCueTable

## @evidence contracts/development/implementation.md#principled-implementation

The WPA's playing surface, bed height, nose height as its share of the ball's diameter and rail width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, split the bounded bed and rails around each pocket, then record their aiming and support affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rail caps are level with their cushion noses. Box cuts approximate pocket jaws and preserve open physical mouths at the WPA widths.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed number of regions per table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the table stands, its contacts, and what is left out with why.
