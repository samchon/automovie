# src/environments/buildings/buildingWalls.ts#buildingWalls

## @evidence contracts/development/implementation.md#principled-implementation

Every admitted room endpoint on a collinear edge contributes a cut; adjacent cuts give maximal intervals with constant room incidence. Interior overlap has already been refused by buildingPlans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop constructs and associates subdivided edges before apertures select from them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero-length intervals are not emitted and ambiguous or missing aperture hosts refuse with the aperture path rather than selecting an arbitrary edge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of E edges scans the O(E) authored unique endpoints and orders its incident cuts. Opening assignment scans the resulting intervals per opening; inputs are compact plan graphs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constructs one plan's wall table in one call; the prepared result belongs to the building definition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds edge, cut and aperture lists only within plan preparation. Returned wall records own only their intervals and opening references.

## @evidence contracts/development/common.md#meaningful-documentation

States shared-wall construction, winding, opening association and the normalized input.
