# src/weapons/createMagazine.ts#createMagazine

## @evidence contracts/development/implementation.md#principled-implementation

One box of the published length, width and depth; a loaded magazine adds the published difference between the loaded and the empty weight, the rounds' mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, one part, three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The base plate's lip, the feed lips and a rifle magazine's curve are not modelled; no contact needs them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the magazine stands, how it seats in a well, and its three contacts.
