# src/pose/AutoMovieClinicalAxis.ts#AutoMovieClinicalAxis

## @evidence contracts/development/common.md#meaningful-documentation

Names the clinical coordinate vocabulary and its angle consumer.

## @evidence contracts/development/design.md#principled-representation

The closed union permits exactly the three coordinates accepted by joint articulation and rest frames; numeric admission belongs to jointToQuaternionOnBasis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the common axis keys used by jointToQuaternion and jointToQuaternionOnBasis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coordinate names are independent of bone identity and contain no implementation or platform dependency.
