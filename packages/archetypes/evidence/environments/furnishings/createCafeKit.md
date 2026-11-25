# src/environments/furnishings/createCafeKit.ts#createCafeKit

## @evidence contracts/development/implementation.md#principled-implementation

Uses the measured local extents of a service counter, dining table and dining seat. Two chairs face inward with their front of occupancy at the table's two Z edges. The counter is a wall piece centred on the -Z wall, and its front clearance, as deep as the aisle, reserves its approach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses the reusable models and local dining arrangement. FurnishRoom owns fit, grid placement and transformed model/prop/anchor emission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Capacity and scene clearances are supplied and checked per room. Counter and chairs use their native contact records. The grid and default aisle describe a coarse layout rather than a guarantee of accessibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds and measures three model prototypes once per occurrence. Work per repeated table follows the shared room planner and is bounded by the requested population and candidate grid size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All dining groups in an occurrence share the table and chair draw and their extents while retaining distinct prop ids and transforms. The optional occurrence seed is separated by prototype role.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module captures the room parameters only. Model prototypes and planner allocations belong to one call and survive only where the emitted stage records use them.

## @evidence contracts/development/common.md#meaningful-documentation

States room orientation, defaults through the shared layout, count, role paths, returned records and placement refusal.
