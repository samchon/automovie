# src/props/createDrinkware.ts#createDrinkware

## @evidence contracts/development/implementation.md#principled-implementation

Dimensioned rods from the drawn height and diameters; grip frames follow the `handle` convention with the wrapped axis along the vessel's or the handle bar's axis, and the content's mass is the fill times the stated capacity at water's density.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, then build the body and the kind's own parts with their grips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body is a straight cylinder: a glass's taper and a bottle's shoulder are left out as picture detail that no contact reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most six parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is modelled, where the grips and the lip stand and how the vessel is oriented.
