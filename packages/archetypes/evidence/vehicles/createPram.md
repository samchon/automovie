# src/vehicles/createPram.ts#createPram

## @evidence contracts/development/implementation.md#principled-implementation

Four wheel discs at the chassis' corners, a bassinet box of the drawn length and width on them, two push rods from its back up and back to the drawn handle height, and the push bar across their tops.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, the wheels, the bassinet, the push rods and the bar, then the two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hood, springs or brake; the wheels do not turn; the wheels', bassinet's and rods' sizes are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the pram stands, who pushes it from where and its two contacts.
