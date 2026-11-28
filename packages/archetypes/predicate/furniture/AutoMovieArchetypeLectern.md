# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.create

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, reading slope and measured dimensions, default mass and two surface contacts.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the reading slope and surface depth to compute the horizontal run and front drop. The slab's top and both affordances share the computed plane. The ledge marks the boundary of the slab.

## @evidence contracts/development/implementation.md#efficient-algorithms

One band draw supplies both boxes and both frames. The computed slope, run and edge height are shared across the construction.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the centre of the reading plane and the lower edge along model X.

## @evidence contracts/development/design.md#principled-representation

The `top` is a surface and the `front` is a ledge with the same tilted normal. Both positions come from the realised slab.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two contacts provide a reading support and edge anchor through their existing motion kinds.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States measured axes, including the distinction between along-plane depth and floor height.

## @evidence contracts/development/design.md#principled-representation

Width follows X and depth is measured along the reading slab. Rear height and slope fix the plane, and mass supplies body properties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five named dimensions are the inputs the cabinet, reading surface and body mass use.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the geometry, angular and mass units.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the optional ID and applicable dimensions in the existing bands.

## @evidence contracts/development/design.md#principled-representation

A partial record ties authored values to the producer's named bands. Equal endpoint geometry stays fixed to the sourced design.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The settings expose physical dimensions and the object ID through one shape.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene object ID and default `lectern`.

# src/furniture/AutoMovieArchetypeLectern.ts#AutoMovieArchetypeLectern.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the fixed reading surface and slope and the provisional body mass.
