# src/physics/physicalBalanceRamp.ts#physicalBalanceRamp

## @evidence contracts/development/common.md#meaningful-documentation

States what each stance foot's seating advances, how a first stance and a landed foot start, when a foot's anchor is latched, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

Each stance foot's seat is advanced by `physicalStanceSeat`, its hysteresis following Coros, Beaudoin and van de Panne 2010, Section 3.3, and its ramps the WBDC contact-transition smoothing (Kim, Jorgensen and Sentis 2018); a foot that touches again after leaving the holds is latched where it stands (design-4017-qp3, Section 3, rules 2 and 3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the limbs not asked to step: the seat copied or created, then advanced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; a first stance's seat starts borne and flat with an equal share of the weight, its stated premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limbs, each one sole-vertex scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the seating holds one seat per limb, owned by the caller's state.
