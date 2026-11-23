# src/scene/flattenRigidParts.ts#flattenRigidParts

## @evidence contracts/development/implementation.md#principled-implementation

Uses native clone/applyMatrix4 to realize rigid world-rest geometry, adds traversal-index part identity and merges indexed attribute-compatible buffers with native groups; skin/morph/multi-material input refuses, color layout normalizes to Float32 RGB(A) and missing color/relief channels use neutral one. Invertible admitted transforms and compatible remaining attributes are premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns rigid buffer normalization/merge only and borrows original materials, leaving generated model acquisition and optional gait bake to their own owner; owned temporary clones never become persistent per-member geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual source part follows the same native transform and attribute rules; neutral color/alpha/relief values are multiplication identities, not fixture colors, and unsupported deformation is refused rather than drawn at rest under a generic wrapper.

## @evidence contracts/development/common.md#meaningful-documentation

States source immutability, rigid-only admission, ordered part indices, mixed-color/relief normalization, borrowed materials and intermediate/failure retirement boundaries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Clones/transforms all V source vertices, scans color attributes and fills only normalized channels, then merges V vertices/indices once; O(V+indices) dominant buffer work with peak temporary source-clone plus merged arrays and O(P) part/material references.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses actual source material objects and one canonical merge rather than creating per-member materials; normalization reuses native transformed attributes, while mutable source matrices/buffers preclude an unkeyed cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Registers clones before transform/attribute edits and independently disposes all intermediates on success/refusal; if intermediate retirement fails, the untransferred merged geometry also retires. Success transfers exactly one merged geometry and borrowed material references, never disposing caller-owned source geometry/materials.
