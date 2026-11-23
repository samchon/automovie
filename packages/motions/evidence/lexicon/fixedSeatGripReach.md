# src/lexicon/fixedSeatGripReach.ts#fixedSeatGripReach

## @evidence contracts/development/implementation.md#principled-implementation

Tests the average projection of the two wrist distances. Opposite lateral normals cancel any translation of the pelvis across the seat. Central bones contribute at most their lengths. The clavicle cone's support is concave in the dot product with its axis, bounding both clavicles together even for asymmetric spinal rotations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Measures the finite ancestor chains and their angular envelopes once per plan. Each requested pair uses one point projection and scalar arithmetic; no pose evaluations, searches or temporal samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the two named wrist goals, bone geometry and declared clinical bounds. An inconclusive inequality passes through to the original fitting law.
