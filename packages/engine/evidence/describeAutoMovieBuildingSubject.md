# src/describeAutoMovieBuildingSubject.ts#describeAutoMovieBuildingSubject

## @evidence contracts/development/implementation.md#principled-implementation

Ownership is the element hierarchy below the unit's root, which the built environment states is total, so a breadth-first walk of the parent relation is exactly the unit's census; populations follow the space tree because they are placed in spaces, and the union of the collected boxes is the unit's extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner for a building subject; the caller supplies the environment's part boxes so the staging they need is done once per environment rather than once per owned element.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No building or element kind is special-cased; transform-only groups contribute nothing because they draw nothing, and an empty unit reports null rather than a degenerate box.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both content sources and why each is included, the transform-only and empty cases, the members, the empty fields, the units, and what `boxes` must hold.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the environment's elements and spaces plus the owned elements' part boxes: one child index, one breadth-first walk with a visited set, and one space-subtree walk.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Describes one unit per call over boxes the caller computed once per environment and shares across its units.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The child index, queue and collected boxes are released on return, each bounded by the element count; the caller owns the returned description.
