# src/sport/createSurfboard.ts#createSurfboard

## @evidence contracts/development/implementation.md#principled-implementation

One of the chart's three boards whole, its length, width and thickness as the chart gives them; the deck on top and the rail at the board's widest point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the board, draw the mass, then place the deck, stance and rail readings from its dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No board between the chart's rows is made; the board is a box: no outline, rocker or fins.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the board lies, how its model is chosen and what each contact represents.
