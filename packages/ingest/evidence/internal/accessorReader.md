# src/internal/accessorReader.ts#accessorReader

## @evidence contracts/development/implementation.md#principled-implementation

Validated offsets/stride and unsigned byte/short or FLOAT formats define little-endian reads; normalized integers scale by their exact maximum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closure owns DataView and addressing, shared by weight coverage and motion FLOAT decoding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sparse overrides and unsupported component formats throw instead of being treated as dense data of another type.

## @evidence contracts/development/common.md#meaningful-documentation

Comments give admitted formats, normalized scaling, element/component arguments and borrowed payload lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reader setup is constant time; each requested component costs one address calculation and one scalar DataView read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One resolved view/stride/DataView serves every component of this accessor, avoiding repeated metadata resolution.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure borrows one payload until its owning profile finishes; it retains no global reader cache or handle.
