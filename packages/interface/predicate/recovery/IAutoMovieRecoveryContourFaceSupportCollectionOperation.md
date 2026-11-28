# src/recovery/IAutoMovieRecoveryContourFaceSupportCollectionOperation.ts#IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The function consumes ordered cut point addresses and existing original-face incidence maps, returning one distinct broad support set.

## @evidence contracts/development/design.md#principled-representation

A coincident vertex pair uses vertex incidence, and two different endpoint IDs use edge incidence. The union preserves original face ordinals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This stage measures broad incident support. Actual cut-emitting segment faces come from the separate slicer provenance.
