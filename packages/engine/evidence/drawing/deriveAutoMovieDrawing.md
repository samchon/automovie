# src/drawing/deriveAutoMovieDrawing.ts#deriveAutoMovieDrawing

## @evidence contracts/development/implementation.md#principled-implementation

An orthographic drafting pipeline over the validated design: one resolved frame, element staging shared with the scene through `builtEnvironmentWorldMatrices`, convex-cell sections, shared opening sizing, and feature resolution against current geometry; the digest is SHA-256 of `canonicalizeAutoMovieJson`, with deterministic member ordering and escaping over the authored JSON payload, and the stated limitations are the gaps the record carries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The derivation validates, indexes the design once, delegates drafting, sectioning, opening marks, extent and feature resolution to one helper each, and keeps only the gap wording and record assembly, so each stage owns one responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No design, view or element is special-cased; the gaps are fixed statements of what this derivation does not compute, and duplicate dimension and note ids are refused rather than silently disambiguated.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states every refusal and its cause, where each kind of content comes from, the one-way rule, the gap policy, why openings ignore the kind filter, the digest's coverage and the ordering of each array.

## @evidence contracts/development/implementation.md#efficient-algorithms

Includes full environment validation, model tessellation/placement and linear triangle drafting, quadratic clipping in each cell's plane count, and feature-local corner/edge sorting for each dimension end or annotation. Output arrays and canonical object keys are sorted before text encoding/hashing; unknown filter ids use a shared set rather than repeated space scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One design index serves every stage, so element lookups, world matrices and part tessellations are computed once and shared by drafting, opening marks and every dimension end and note; the index is built per call because the environment is the caller's mutable record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The design index and stage temporaries are owned by this call and released when it returns, bounded by the design's size; only the returned drawing, owned by the caller, survives.
