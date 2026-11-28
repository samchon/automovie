# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.lay

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the shell and signed lead geometry, the contact midpoint and admission inputs.

## @evidence contracts/development/implementation.md#principled-implementation

One annular fitting follows the neck axis and carries a lead whose grip lies at its real midpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares the neck and its fitting once, then emits the parts and one grip to the builder.

# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the units, neck-width fit and meaning of the grip aperture.

## @evidence contracts/development/design.md#principled-representation

The shell uses along-neck width and radial thickness; the lead uses length and radius to place its midpoint grasp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four dimensions completely specify the fitted shell and straight lead.

# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.IParams.width

## @evidence contracts/development/common.md#meaningful-documentation

Measures width along the neutral neck and identifies its fit limit.

# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.IParams.thickness

## @evidence contracts/development/common.md#meaningful-documentation

Measures the actual material added beyond the neck radius.

# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.IParams.leadLength

## @evidence contracts/development/common.md#meaningful-documentation

Measures the complete modelled shaft from its collar attachment.

# src/animals/AutoMovieArchetypeQuadrupedLead.ts#AutoMovieArchetypeQuadrupedLead.IParams.leadRadius

## @evidence contracts/development/common.md#meaningful-documentation

Relates the real round section's radius to double-sized grip aperture.
