# src/furniture/AutoMovieArchetypeGurney.ts#AutoMovieArchetypeGurney.create

## @evidence contracts/development/common.md#meaningful-documentation

States the caster bed structure, seedless litter and surface heights and contacts.

## @evidence contracts/development/implementation.md#principled-implementation

Four fixed casters support the body. The litter locates the mattress underneath, so adding thickness places all three support and side-edge frames.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw produces fixed caster and body parts with a shared computed surface height.

# src/furniture/AutoMovieArchetypeGurney.ts#AutoMovieArchetypeGurney.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the patient and outer geometry, litter height, mattress thickness and mass units.

## @evidence contracts/development/design.md#principled-representation

Patient width and length locate the mattress. Overall width and length set caster positions. Litter and thickness determine the patient height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The exposed dimensions belong to the stretcher geometry and empty mass.

# src/furniture/AutoMovieArchetypeGurney.ts#AutoMovieArchetypeGurney.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

States the patient-support surface height and two opposed side seats.

## @evidence contracts/development/design.md#principled-representation

The upward plane and side seats share the physical mattress top. Their depth and width follow the measured mattress.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The names expose only the stretcher's emitted patient and side contacts.

# src/furniture/AutoMovieArchetypeGurney.ts#AutoMovieArchetypeGurney.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States applicable fixed dimensions and object ID.

## @evidence contracts/development/design.md#principled-representation

The admitted table owns the geometry and mass bounds including the litter's range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses saved dimensions with a subset for the stretcher.
