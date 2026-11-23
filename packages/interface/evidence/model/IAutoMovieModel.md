# src/model/IAutoMovieModel.ts#IAutoMovieModel

## @evidence contracts/development/design.md#principled-representation

Stable model identity joins parts, materials and an optional skeleton; validateModel checks their references and numeric domains, while imported appearances carry a compiler-sealed digest closure and authoritative bone indices rather than runtime name inference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One model groups reusable geometry and capabilities separately from scene placement; each part owns a geometry representation, origin owns provenance, and optional body, contacts and profiles add their respective semantic inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Generated meshes must come from reviewed generators, and imported visual bytes do not invent physics or inherit traits; the deterministic proxy and sealed asset ledger remain the owners of those distinct facts.

## @evidence contracts/development/common.md#meaningful-documentation

Explains rigged-versus-rigid subjects, optional gaze through eye bones, part, material and carried-image ownership, provenance, null physics and skeleton meanings, optional affordances and profiles, and compiler-owned asset digests and bone mapping.
