# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.create

## @evidence contracts/development/common.md#meaningful-documentation

States the floor and forward axes, measured footprint and seat height, default mass and contact location.

## @evidence contracts/development/implementation.md#principled-implementation

Each leg joins a footprint corner to a seat corner. The shell rests at the measured seat height and the back reaches the measured chair height. The `seat` frame uses the same width, depth and physical front edge as the shell.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw resolves seven dimensions. The builder emits four rods, two boxes and one seat contact with fixed work for this geometry.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Places the seat frame at the physical shell's forward edge.

## @evidence contracts/development/design.md#principled-representation

The one affordance uses the shell's upper plane and footprint. Its name is the same lookup name used for ordinary seating.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result surface exposes the usable seat without introducing contacts for absent components.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes floor, back, seat and mass dimensions.

## @evidence contracts/development/design.md#principled-representation

Floor footprint determines the leg endpoints. Seat and back dimensions determine the remaining geometry and the named contact. Mass has its own kilogram unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each dimension feeds the actual geometry, contact or body property.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Names metres for geometry and kilograms for empty mass.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the supported fixed dimensions and the fixed-band shape behavior.

## @evidence contracts/development/design.md#principled-representation

The partial dimension map supports explicit values and omission. The draw session checks finite values against the exact shape bands or the provisional mass interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional ID and the existing dimension names define the authorable controls.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the scene object ID and seed-independent `highChair` default.

# src/furniture/AutoMovieArchetypeHighChair.ts#AutoMovieArchetypeHighChair.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies fixed ANTILOP geometry and the provisional mass interval.
