# src/vehicles/createSpacecraft.ts#createSpacecraft

## @evidence contracts/development/implementation.md#principled-implementation

Shared station sections generate a hollow tapered shell; the rear wall and deck meet at one threshold, and the hinge owns the leaf and handle. Mass is the nominal scenic material density times the drawn solids' volume.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build the wall sections, frame the rear aperture and add crew furniture, then describe the associated contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Historical sources inform visual roles. All dimensions describe a fictional set; no solid spans the cabin cavity and no operating spacecraft systems are represented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses a fixed number of boxes, rods and convex panels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two adjacent hull segments share their shoulder station; each convex panel is prepared once and its volume is reused for total mass.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The builder hands its model to the caller and retains no external resources.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the cabin frame, boarding direction, hinge and dimension controls.
