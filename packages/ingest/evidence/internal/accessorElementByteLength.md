# src/internal/accessorElementByteLength.ts#accessorElementByteLength

## @evidence contracts/development/implementation.md#principled-implementation

Component byte width and logical shape count define dense size; MAT2/MAT3 narrow components pad each column to four bytes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sizing owner serves dense, sparse and reader stride defaults so storage alignment rules have one representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Padded matrix cases are glTF layout contracts rather than fixture corrections; shape/type admission is a required caller premise.

## @evidence contracts/development/common.md#meaningful-documentation

Prose distinguishes logical component count from physical bytes and names the column-alignment cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed shape lookup and at most three padding branches require constant time without reading elements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All accessor consumers reuse equivalent storage sizing from the same two fixed vocabulary tables.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function owns no arrays, byte views or retained state and returns one scalar size.
