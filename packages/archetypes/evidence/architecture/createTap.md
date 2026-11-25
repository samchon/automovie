# src/architecture/createTap.ts#createTap

## @evidence contracts/development/implementation.md#principled-implementation

A body rod of the drawn height and diameter, a spout rod at the drawn outlet's height out to the drawn reach, and a lever box on its top that turns with the `lever` knob.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, the body, the spout, the lever, then the two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lever turns but does not tilt, so the flow is not modelled; the spout's and lever's sizes and the lever's turn are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the tap stands, which way the spout reaches and its two contacts.
