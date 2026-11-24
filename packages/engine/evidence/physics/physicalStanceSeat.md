# src/physics/physicalStanceSeat.ts#physicalStanceSeat

## @evidence contracts/development/common.md#meaningful-documentation

States the seating hysteresis, the load filter, the bearing and flatness ramps and their thresholds.

## @evidence contracts/development/implementation.md#principled-implementation

The seating hysteresis follows Coros, Beaudoin and van de Panne 2010, Section 3.3. The ramps follow the WBDC contact-transition smoothing (Kim, Jorgensen and Sentis 2018). The thresholds are `physicalStanceBalance`'s stated constants.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Seating, then load, then bearing, then flatness, each one assignment on the seat.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or non-null assertions. An absent share defaults to one, the first stance's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per foot per substep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one seat from this substep's readings; there is nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

It writes only the caller's seat record and allocates nothing.

# src/physics/physicalStanceSeat.ts#physicalStanceSeat.ISeat

## @evidence contracts/development/common.md#meaningful-documentation

Names the recovery state's seat record.

## @evidence contracts/development/design.md#principled-representation

An alias of the interface's own record, so the state's checkpoint owns it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by advancePhysicalBalance and this module.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It declares no copy of the record.

# src/physics/physicalStanceSeat.ts#physicalStanceSeat.lowPass

## @evidence contracts/development/common.md#meaningful-documentation

States the filter, its time constant and its units.

## @evidence contracts/development/implementation.md#principled-implementation

A first-order low-pass with gain min(1, dt / LOAD_SECONDS).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains and allocates nothing.
