# src/furniture/createBarrel.ts#createBarrel

## @evidence contracts/development/implementation.md#principled-implementation

One cylinder of the drawn diameter and height; the hands' places are the top rim's two ends of the `X` diameter, and the top's outline a polygon inscribed in the rim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick a drum's model, draw the dimensions with its height and mass over them, then one part and its three contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rolling hoops, bungs, spear or handholes: the rim stands for the gripped chime or skirt.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the barrel stands and where it is held.
