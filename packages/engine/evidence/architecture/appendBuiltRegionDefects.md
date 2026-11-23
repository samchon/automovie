# src/architecture/appendBuiltRegionDefects.ts#appendBuiltRegionDefects

## @evidence contracts/development/implementation.md#principled-implementation

Refuses non-finite or near-zero computed shoelace area before the shared edge-contact simplicity check. These checks enforce the chosen simple-region contract; they do not assert that every self-crossing ring lacks an even-odd interpretation or certify exact-real area from binary64 arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One region rule shared by boundary faces and opening voids, applied to the outline a face states and to the hull an arched opening bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No region is re-wound, simplified or repaired, and orientation is not judged because either winding has an inside.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why both conditions matter, the area tolerance, which violation each produces and in what order, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) area work followed, when needed, by O(N²) edge-pair simplicity work; no small fixed outline size is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one region per call; each outline is judged once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond at most one violation appended to the caller's collector.
