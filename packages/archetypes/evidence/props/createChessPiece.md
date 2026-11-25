# src/props/createChessPiece.ts#createChessPiece

## @evidence contracts/development/implementation.md#principled-implementation

A base disc, a body and a head at the kind's FIDE height, the base at 45 percent of it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the kind and side, record the dimensions, lay the three parts, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The profile's proportions and the mass are named provisional estimates; the heights are read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three parts and two contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Names the source heights and base, the frame and the two contacts.
