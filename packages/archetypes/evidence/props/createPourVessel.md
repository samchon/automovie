# src/props/createPourVessel.ts#createPourVessel

## @evidence contracts/development/implementation.md#principled-implementation

Two polygonal sections on the same radial planes bound per-sector convex wall cells. Their same ring locates the lip and closes against a solid floor. Three rods form the handle and share its bar axis with the hook affordance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build floor and wall cells, then add the handle and rim contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Physical and visible walls share one bounded solid per sector. The opening and handle clearance remain free of enclosing hulls.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed sixteen wall cells of eight corners, one floor of thirty-two corners and three handle rods per model.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits one independently dimensioned vessel.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builder returns only the in-memory vessel data and acquires no external resource.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies both catalogue variants, the open dimensions and units, and each vessel's rest frame and contact sites.
