# src/index.ts#AutoMovieGeometryPhysicalVertices

## @evidence contracts/development/design.md#principled-representation

Generated records are copied and admitted by resolveAutoMovieMeshPhysicalVertices; static glTF pairs decode unsigned low/high words into one-based source references, reserving zero for null and reading interleaved accessors component by component.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read and owned-write paths share copying and engine validation; imported wire namespaces stay readonly while generated metadata is published only after admission succeeds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing legacy metadata remains absent; orphan attributes, conflicting namespaces and malformed correspondence refuse instead of inventing source identities or rewriting caller-owned imports.

## @evidence contracts/development/common.md#meaningful-documentation

Explains legacy absence, readonly imports, nullable incidence, non-anatomical identity and validation before atomic generated-buffer publication; writeOwned states that undefined removes the prior record.

# src/index.ts#AutoMovieGeometryPhysicalVertices.read

## @evidence contracts/development/implementation.md#principled-implementation

Distinguishes generated and glTF wire namespaces, decodes Uint16 pairs with zero as null and validates copied correspondence against Float32 XYZ through the engine; malformed or conflicting inputs refuse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both namespace paths converge on copy and validate, keeping representation decoding in the viewer and physical correspondence admission in the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Legacy absence returns undefined; an orphan source attribute cannot create inferred anatomical identity or bypass wire validation.

## @evidence contracts/development/common.md#meaningful-documentation

States absence and refusal behavior and why interleaved attributes must be read through accessors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Source copying and vertex/XYZ extraction are linear in source and vertex counts, with temporary arrays of the same order before engine admission.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Buffer attributes and userData can change independently, so each read admits the current pair rather than reusing an earlier validation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns an independent correspondence record and retains no geometry, accessor or temporary XYZ array.

# src/index.ts#AutoMovieGeometryPhysicalVertices.writeOwned

## @evidence contracts/development/implementation.md#principled-implementation

Refuses imported wire metadata, removes generated metadata for undefined and otherwise copies and validates the candidate before replacing geometry.userData, preserving the previous record on admission failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This operation owns generated metadata publication while geometry-buffer updates remain with buildGeometry or the human buffer owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Explicit all-null correspondence remains explicit; imported records are never rewritten to make a generated candidate appear admissible.

## @evidence contracts/development/common.md#meaningful-documentation

Documents replacement, removal, readonly imported state and the caller's requirement to validate before atomic buffer publication.

## @evidence contracts/development/implementation.md#efficient-algorithms

Undefined removal is constant time; present metadata copies sources and vertices and extracts XYZ once for linear-size engine validation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each candidate is a publication request over current attributes; sharing a prior admitted record would lose ownership isolation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Geometry retains only the newly admitted copied table; replacement or deletion releases its previous reference and no GPU allocation is acquired here.
