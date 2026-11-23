# src/production/IAutoMovieCompiledFormationLod.ts#IAutoMovieCompiledFormationLod

## @evidence contracts/development/design.md#principled-representation

selectFormationLod compares distance scaled by projected pixel size against table-order thresholds; ascending positive thresholds and a final null are caller premises. compiledLodModelDigest hashes the canonical model group or a missing/unencodable marker, so the digest alone does not establish that a model was admitted or materialized.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Semantic tier, distance bound, model group identity and resolved runtime model separate authored representation choice from the concrete runtime object consumed by the viewer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A group id alone cannot certify changed geometry or materials, and no camera-distance selection invents a model absent from the compiled representation table.

## @evidence contracts/development/common.md#meaningful-documentation

Gives near-to-far tier meaning, positive maximum metre distance and terminal null, model group identity and compiler-owned runtime model reference.
