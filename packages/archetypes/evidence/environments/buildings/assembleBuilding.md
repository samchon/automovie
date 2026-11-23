# src/environments/buildings/assembleBuilding.ts#assembleBuilding

## @evidence contracts/development/common.md#meaningful-documentation

Describes use of the admitted plan, canonical staged set, room support and room and aperture frames.

## @evidence contracts/development/implementation.md#principled-implementation

The floor polygon, exact prism cells and slab share the same region, split walls share both incidences, and opening metadata drives the real wall cut. All world support and anchors are placed from the same upright transform used for visible elements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates room, wall, butt joint and aperture ownership before invoking the existing building lowering gate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A facade contributes no false interior support. Door fills are the aperture dimensions and closed portals have no declared traversal connector.

## @evidence contracts/development/implementation.md#efficient-algorithms

Assembly pays the geometry and topology algorithms of its rooms and apertures, O(E log E) total for small joint hulls, and existing validation at lowering. The measured mesh kernels own their own complexity.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses one admitted region for plan, enclosure and slab; independent live nodes preserve their own instance identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The flat result is bounded by planned room edges, apertures, levels, mesh tessellation and zone names. Returns caller-owned records without handles or an assembly cache.
