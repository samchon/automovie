# src/weapons/createShield.ts#createShield

## @evidence contracts/development/implementation.md#principled-implementation

The disc, boss and grip record the existing mass geometry. The foam variant sizes the arm loop and lateral rim marks from the same radius and thickness as the board.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the model's dimensions, then place its rigid parts and marks relative to the board.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stage loop is fixed foam geometry with a contact frame for authoring. It carries no cloth, tension or implied humanoid constraint.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of parts and affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the shield stands, what it is built of and what each contact is.
