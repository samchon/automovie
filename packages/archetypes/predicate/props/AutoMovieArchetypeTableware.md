# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.create

## @evidence contracts/development/common.md#meaningful-documentation

States how the ceramic slabs sit, how each stacks and where hands meet its rim or underside.

## @evidence contracts/development/implementation.md#principled-implementation

Each shape builds one flat floor-supported body. Its stacking region matches the footprint, its two rim grips close across the height, and its underside faces down.

## @evidence contracts/development/implementation.md#efficient-algorithms

Chooses one model or band row and builds one solid plus a fixed 16-point circle or four-corner rectangle for the stacking outline.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Gives the saucer's recorded dimensions and mass and names the shapes using complete model figures.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the scene identity for each of the three shapes.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Explains why the shape changes the footprint and selects measurements.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States that a catalogue choice belongs to round plates or platters and that the saucer uses fixed bands.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the three names in gallery order.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Describes each row as a correlated model with a seedless default and flags IKEA masses as packed weight figures.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.OUTLINE

## @evidence contracts/development/common.md#meaningful-documentation

Names the polygon vertex count and why it is only for round stacking outlines.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Connects the same physical units to the complete plate records and saucer bands.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names each of the four contacts and locates both rim grips in the model frame.

## @evidence contracts/development/design.md#principled-representation

Opposite X edges are held at half height. Stacking and downward support use the top and bottom planes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The published vocabulary contains one upper stack, two side holds and one lower support.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the axes and units for round and rectangular geometry and the mass unit.

## @evidence contracts/development/design.md#principled-representation

A round footprint uses one diameter and a rectangular footprint spans the X and Z extents separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares height and mass across forms and allows only the footprint dimensions that describe the chosen shape.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.Figures

## @evidence contracts/development/common.md#meaningful-documentation

Explains that a model row keeps the measured dimensions and mass together.

## @evidence contracts/development/design.md#principled-representation

A partial record carries the circular or rectangular geometry as correlated figures in the same units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing dimension keys for both shapes without another model-specific set of units.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names each authorable choice and the applicable finite fixed values.

## @evidence contracts/development/design.md#principled-representation

The shape chooses the relevant catalogue or fixed bands. Model and explicit values are admitted by that shape's table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds the shape, optional scene identity and measurement controls used by the producer.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the round plate, rectangular platter and round saucer.

## @evidence contracts/development/design.md#principled-representation

The literals distinguish the footprint and measurement scheme for each shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One selector keys the geometry decision and both measurement tables.

# src/props/AutoMovieArchetypeTableware.ts#AutoMovieArchetypeTableware.Model

## @evidence contracts/development/common.md#meaningful-documentation

Enumerates the round plate and serving platter IDs.

## @evidence contracts/development/design.md#principled-representation

Each ID selects the measured dimensions and mass of a complete recorded commercial object.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The literal union is limited to the seven rows admitted by the two shape-specific catalogues.
