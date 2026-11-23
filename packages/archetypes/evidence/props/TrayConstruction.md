# src/props/TrayConstruction.ts#TrayConstruction.ServingTrayContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of servingTray.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only servingTray and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/TrayConstruction.ts#TrayConstruction.servingTray

## @evidence contracts/development/common.md#meaningful-documentation

Build a low serving tray with opposing end grips.

## @evidence contracts/development/implementation.md#principled-implementation

Use the side wall thickness and location to define each hook grip, and floor height for the interior placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recorded models own the overall sizes. The decorative rim retains its documented wall estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five boxes and five contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/TrayConstruction.ts#TrayConstruction.BasketContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of basket.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only basket and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/TrayConstruction.ts#TrayConstruction.basket

## @evidence contracts/development/common.md#meaningful-documentation

Build a deep carry basket with an overhead grip.

## @evidence contracts/development/implementation.md#principled-implementation

The floor placement stays below the walls. The hanging hand closes around the straight bar along its long interior axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original two posts and straight bar represent the handle at the documented clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight solids and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.
