# src/vehicles/BoatOars.ts#BoatOars.blade

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and the choice.

## @evidence contracts/development/implementation.md#principled-implementation

The boatbuilders' oar length from the span, then the read oar nearest it, whose blade is taken whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One length, one nearest.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to refuse.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A scan of eight oars.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/BoatOars.ts#BoatOars.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Lengths in metres and angles in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `geometry` and read by `build` and `rowBoat`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/vehicles/BoatOars.ts#BoatOars.geometry

## @evidence contracts/development/common.md#meaningful-documentation

States what is worked out.

## @evidence contracts/development/implementation.md#principled-implementation

The span is the beam and the pivot `createBoat.LOCK` above the gunwale; the inboard and the whole oar by Shaw and Tenney's rule; a square blade on the oar's line, its corners a half width either side of it in the upright plane, so a corner's height is the pivot's less its distance along the oar times the sine of the oar's angle, plus or less the half width times the cosine: at rest the blade's upper root corner is at the water, wholly buried, and at the touch its lower tip corner is, wholly out.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A few expressions.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/BoatOars.ts#BoatOars.build

## @evidence contracts/development/common.md#meaningful-documentation

States the rest pose.

## @evidence contracts/development/implementation.md#principled-implementation

Each oar is a loom from its handle's end to its blade's root and a square blade on its line, at the rest angle `geometry` gives. The oarlock's turn is a two-sided `wheel` about the upright through the pivot, `+Y` down on the left and up on the right so a positive turn swings either blade toward the bow, reaching the catch's arc; the lift is a `hinge` about the pin, square to the oar and level, riding the turn, `+Y` along `+Z` on the left and `-Z` on the right so a positive lift raises either blade, reaching `clear`; the handle rides the lift.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the two sides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The blade is a flat board; its spoon and the oar's leather, button and feathering are not built.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three parts per oar.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
