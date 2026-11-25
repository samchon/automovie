# src/props/createFingerRing.ts#createFingerRing

## @evidence contracts/development/implementation.md#principled-implementation

The inner circumference is the ISO 8653 size; the band's centreline lies half a wire outside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, lay the band's pieces, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The circle is drawn as straight pieces; the wire and the mass are marked provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of pieces.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is modelled, how it lies and its two contacts.
