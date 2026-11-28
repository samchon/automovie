# src/props/AutoMovieArchetypePen.ts#AutoMovieArchetypePen.create

## @evidence contracts/development/common.md#meaningful-documentation

States the barrel pose, default cylinder dimensions, axial tip and 30-millimetre grip offset.

## @evidence contracts/development/implementation.md#principled-implementation

The cylinder's dimensions place the barrel bottom on the floor and its tip along positive Z. The grip is measured backward from that tip.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one admitted barrel draw, one cylinder and two local frames.

# src/props/AutoMovieArchetypePen.ts#AutoMovieArchetypePen.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the precision barrel grip and the axial tip face.

## @evidence contracts/development/design.md#principled-representation

The grasp lies back from the tip, and the working point faces in the direction of writing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The handle and contact point are the two semantic frames the pen creates.

# src/props/AutoMovieArchetypePen.ts#AutoMovieArchetypePen.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Identifies length and diameter along the barrel frame, with the prop mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The cylinder uses its metre-valued length and thickness as axial length and barrel diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pen publishes the three returned keys supplied by its band table.
