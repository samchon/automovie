# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit

## @evidence contracts/development/design.md#principled-representation

The nearest point is the projection onto the nearest face interior or closed edge segment, and the sign comes from that feature's angle-weighted pseudonormal after Baerentzen and Aanaes, which classifies sides correctly for a closed, consistently wound, self-intersection-free surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Point, normal, both distances, face ordinal, feature kind and boundary flag in one record, because hair contact, brow contact, body layer ordering and skin voxelization need the contact point, its side and whether that side is trustworthy from a single traversal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point within rounding of the surface keeps its computed sign or zero instead of being snapped to a side by a fixed tolerance, and a rim feature is flagged rather than given an invented side.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the frame and units, ownership of the vectors, each field's derivation, when the signed distance is zero, the tie rule, and when the boundary flag is set.
