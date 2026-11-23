# src/core/poseArchetypeSpanGrips.ts#poseArchetypeSpanGrips

## @evidence contracts/development/common.md#meaningful-documentation

States fixed origins, explicit held-end ownership, unoriented +X tangent, full rein-run coverage and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The segment defines its unit tangent. Choose the tangent sign nearest the current grip +X and apply the shortest rigid rotation, preserving an orthogonal outward normal. A rein's half-length must fit on both sides of its unchanged hand origin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index contacts, admit compatible segment tangents and occupied held runs, then independently replace only the explicitly held frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hand anchor moves, no contact-only rope substitutes for geometry and no last-writer rule hides incompatible simultaneous lines. Positional slack is only coordinate-scaled binary64 arithmetic error.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(A+S) maps and visits follow the already completed endpoint calculations for A contacts and S spans; no state is recalculated or cached.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses exactly the span states emitted by the geometry owner and the existing shortest-rotation operation; unchanged contacts and no-held-span lists are reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Maps are call-local, changed frames own new nested records and no model, prior pose or external resource is retained.
