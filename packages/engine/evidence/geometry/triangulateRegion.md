# src/geometry/triangulateRegion.ts#triangulateRegion

## @evidence contracts/development/implementation.md#principled-implementation

Composition of `canonicalRegion`, which admits the rings and fixes winding by signed area, and `trianglesOf`, which bridges holes and ear-clips; the triangles index the canonical points, so they are attached to the layout they were computed from.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The labelled pairing of layout and triangles shared by the public entry and region extrusion, while a loft calls the two halves separately because it triangulates only its caps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no repair or fallback between the two steps; either one's refusal propagates unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

States what it composes, who calls it with which label, each parameter's unit and role, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One validation and layout pass and one triangulation, with no repeated work; costs are answered on `canonicalRegion` and `trianglesOf`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one region per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the layout's arrays are spread into the returned record beside the new triangle array.
