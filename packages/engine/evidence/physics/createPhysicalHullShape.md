# src/physics/createPhysicalHullShape.ts#createPhysicalHullShape

## @evidence contracts/development/implementation.md#principled-implementation

Original engine operations allocate the rotation and offsets. Actual owned outputs issue one shape receipt without changing public field aliases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One identity allocation, original offset operator and shape assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original supplied points, actual placement values and shared rotation. Unknown offset or rotation origins issue no receipt.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-time identity and offset creation, independent of hull vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Live native geometry can supply a qualified repeat without losing original public aliases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The group lives with its caller; weak receipts follow individual shapes.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shared rotation, local offsets, points and returned shape ownership.
