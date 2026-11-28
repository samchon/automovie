# src/furniture/AutoMovieArchetypeHospitalBed.ts#AutoMovieArchetypeHospitalBed.create

## @evidence contracts/development/common.md#meaningful-documentation

States raised fixed rails, underlying side-edge frames and default patient height.

## @evidence contracts/development/implementation.md#principled-implementation

The mattress rises by its thickness above the litter. Rail solids rise by the declared offset above that surface, and their bar frames follow their tops. Side-seat frames stay on the interior side of those raised solids.

## @evidence contracts/development/implementation.md#efficient-algorithms

A single draw gives the dimensions and the builder emits a fixed set of casters, support, mattress, rails and resulting frames.

# src/furniture/AutoMovieArchetypeHospitalBed.ts#AutoMovieArchetypeHospitalBed.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States frame and patient extents, litter, mattress depth, rail rise and empty mass in their units.

## @evidence contracts/development/design.md#principled-representation

Outer width and patient width determine the side-rail thickness. Litter and mattress thickness set the patient plane. The rail is measured above it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named shape reports the measurable care frame and mattress without an unrelated flat-bed height key.

# src/furniture/AutoMovieArchetypeHospitalBed.ts#AutoMovieArchetypeHospitalBed.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the mattress surface, edge seats and the static rail bars.

## @evidence contracts/development/design.md#principled-representation

The mattress provides the plane and owned edge frames. Each rail reports a bar at the top of the fixed rail geometry and no movement range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supports the existing mattress, side edge and fixed rail contact lookups.

# src/furniture/AutoMovieArchetypeHospitalBed.ts#AutoMovieArchetypeHospitalBed.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the available fixed care-bed geometry and shared object ID.

## @evidence contracts/development/design.md#principled-representation

Each input maps to the hospital band table, including the rail rise and variation in litter height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The saved bed fields are carried only where the hospital construction uses them.
