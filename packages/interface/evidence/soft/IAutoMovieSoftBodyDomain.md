# src/soft/IAutoMovieSoftBodyDomain.ts#IAutoMovieSoftBodyDomain

## @evidence contracts/development/design.md#principled-representation

simulateSoftBody uses fixed-step position prediction and Jacobi distance projection on an authored lattice, with rest lengths measured from rest coordinates and zero inverse mass at anchors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The independent domain owns solver inputs; architecture furnishing references it rather than changing the cloth algorithm according to its room.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tier has no cloth-on-cloth contact; a cord's self-contact and friction are optional and absent by default. Collider projection is discrete and ordered, and the declared referenceSpeed travel bound does not clamp measured speed or prove continuous collision avoidance.

## @evidence contracts/development/common.md#meaningful-documentation

Members specify row-major arrays, world metre coordinates, kilogram masses, hard anchors, named boundary states, the optional contact record and which self-collision requests are evaluated.
