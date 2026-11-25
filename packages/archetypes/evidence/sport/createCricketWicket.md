# src/sport/createCricketWicket.ts#createCricketWicket

## @evidence contracts/development/implementation.md#principled-implementation

MCC Laws of Cricket 2026, Laws 8.1–8.3, set the 0.2286 m overall width, the 0.7112 m top height and the stump diameter band. Bail barrels and spigots use the published lengths and coarse cylindrical sections.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build and name the stumps, then build and name each bail.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ground clearance and bail placements derive from the fixed wicket height and stump diameter; groove details are omitted.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed part count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds its own prop.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after construction.

## @evidence contracts/development/common.md#meaningful-documentation

States the wicket's origin, arrangement and interaction points.
