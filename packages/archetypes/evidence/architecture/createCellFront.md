# src/architecture/createCellFront.ts#createCellFront

## @evidence contracts/development/implementation.md#principled-implementation

The maker's bar diameter and centres, its flat bars every 12 in, the rule's least ceiling for the grille's height; the bars as many as fit the cell's width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, derive the bars from the width and admit them, the uprights, the flat bars, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No door, frame or ribbing; the flat bars' width is a construction estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rod per bar and one box per flat bar.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the grille stands, which side the cell is and how its bars are named.
