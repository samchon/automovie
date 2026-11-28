# src/furniture/AutoMovieArchetypeCrib.ts#AutoMovieArchetypeCrib.create

## @evidence contracts/development/common.md#meaningful-documentation

States the enclosing slats and rails, seedless interior, mattress top and contact names.

## @evidence contracts/development/implementation.md#principled-implementation

Places the support below the rail by the admitted offset. The mattress top follows support plus thickness. Side bars sit at the rod centrelines, and slat spacing follows the bounded physical opening.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed supports and rails use one draw. The slat passes emit one rod per required spacing interval along each edge.

# src/furniture/AutoMovieArchetypeCrib.ts#AutoMovieArchetypeCrib.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines interior, rail and support dimensions and mass in their units.

## @evidence contracts/development/design.md#principled-representation

Width and length size the enclosure and mattress. Overall height locates the rails, and the rail offset measures down to the mattress support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed inputs correspond to the built enclosure without a loose-mattress size option.

# src/furniture/AutoMovieArchetypeCrib.ts#AutoMovieArchetypeCrib.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the mattress top and two side-bar centrelines.

## @evidence contracts/development/design.md#principled-representation

The surface covers the mattress geometry. Left and right grasp frames sit in the opposed rail rods.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The crib exposes its actual support and rails without a side-seat contact.

# src/furniture/AutoMovieArchetypeCrib.ts#AutoMovieArchetypeCrib.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the id and applicable inputs from the crib's own bands.

## @evidence contracts/development/design.md#principled-representation

The crib takes finite dimensions checked against its interior and frame bands, and the same declared mass unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the named constructor's settings within the crib's own geometry.
