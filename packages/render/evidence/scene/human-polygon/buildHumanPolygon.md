# src/index.ts#buildHumanPolygon

## @evidence contracts/development/implementation.md#principled-implementation

Every dimension comes from skeleton joints, tips and girth radii; no skin surface of the realistic Human is read, so a change in how the Human lofts its skin cannot break the blockout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One section loft draws each rigid module; body-frame placements are consumed once without rebuilding forward kinematics, actual string bone registries expose the same mesh frames, and setPose atomically updates surface and diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture dimension or imitated skin enters the drawing; missing joints refuse; rigid shared seams can open when posed.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the LOD, units, head attachment frame, rigid-joint limitations and sticky palette/resource retirement failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

Bone/child/placement maps are built once for B bones. Ring assembly, zipper joining and normal generation follow emitted vertices V and triangles T, with O(B+V+T) construction work/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parts share the default clay and diagnostic materials; matching RGB overrides share one current material, and sections reuse emitted ring positions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A completed palette becomes owned before the previous pool retires. Independent cleanup attempts every remaining resource and detach operation once; retirement failures remain sticky, reject further colour changes and retain bounded uncertain owners without retry.
