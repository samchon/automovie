# src/scene/human-polygon/mountHumanCartoonFace.ts#mountHumanCartoonFace

## @evidence contracts/development/implementation.md#principled-implementation

Preserves original primitive-transform baking, head-local triangle-front sampling, sixteen-step silhouette bisection and finite float32 checks without changing drawing coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass separates actual-front mounting from mark selection and resource lifetime; the caller disposes its drawing on refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Samples the supplied actual triangle surface instead of a fitted head or hidden offset proxy; original silhouette clamping is retained as an explicit cartoon drawing convention.

## @evidence contracts/development/common.md#meaningful-documentation

States original mounting preservation, actual-front ownership and caller failure cleanup.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each mark vertex and performs one front query, plus at most seventeen additional queries outside the silhouette; each borrowed front query scans its indexed head triangles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Mutates the original mark geometry and reuses its current posed head attachment without making another surface.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows head/object only during the pass and acquires no separately retained geometry, material, task or renderer.
