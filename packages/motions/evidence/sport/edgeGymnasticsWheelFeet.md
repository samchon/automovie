# src/sport/edgeGymnasticsWheelFeet.ts#edgeGymnasticsWheelFeet

## @evidence contracts/development/common.md#meaningful-documentation

States when a window takes an edge, which edge and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

A foot rolled past the subtalar range bears on its forefoot border; the border the roll lowers is the one opposite the border it lifts (`HumanFoot.roll`'s sign).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two readings of the carried foot per foot window, one choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot within the range keeps the window as it was.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two resolves per foot window, once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The foot's roll and edge readers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
