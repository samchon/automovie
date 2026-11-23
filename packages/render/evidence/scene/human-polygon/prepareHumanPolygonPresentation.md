# src/scene/human-polygon/prepareHumanPolygonPresentation.ts#prepareHumanPolygonPresentation

## @evidence contracts/development/common.md#meaningful-documentation

Takes source poses, a source hierarchy, emitted targets and actor staging. Returns a seekable sampler in Human body coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves disjoint subtrees through source parents and requires an emitted part in each subtree. Bends use a live joint pivot. A release admits the replaced live placements and maps its world-space snapshot back through live actor staging.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation owns target admission and reference sampling. Existing pose admission and graphics writes remain at the drawing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual source pivots and emitted descendants. No simulation, graph creation or changes to the source skeletal pose are performed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission builds a child index and visits each selected bone once. A release scans one source pose and retains only its branch placements. Active drawing samples index and visit the live pose once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The source hierarchy and captured release frames are reused across samples, including reverse seeks. Bend-only samples need no actor staging.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one reference frame per released bone and no graphics or external handles.
