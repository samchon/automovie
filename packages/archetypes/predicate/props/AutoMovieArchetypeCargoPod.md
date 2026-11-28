# src/props/AutoMovieArchetypeCargoPod.ts#AutoMovieArchetypeCargoPod.create

## @evidence contracts/development/common.md#meaningful-documentation

States the faceted geometry, physical top, lower mount and seedless body sizes.

## @evidence contracts/development/implementation.md#principled-implementation

The body uses three convex sections. A reduced rectangle fits inside the narrower cap and the bottom centre provides the matching mounting frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one shape record and adds a single socket after the shared pod construction.

# src/props/AutoMovieArchetypeCargoPod.ts#AutoMovieArchetypeCargoPod.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the widest body spans, height and mass in their units.

## @evidence contracts/development/design.md#principled-representation

The dimensions occupy the widest part of the body while the cap footprint is derived from a smaller profile.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the same four keys used by the saved pod's shape.

# src/props/AutoMovieArchetypeCargoPod.ts#AutoMovieArchetypeCargoPod.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the supported top and the bottom mount.

## @evidence contracts/development/design.md#principled-representation

The upper placement rectangle follows the cap and a fixed socket occupies the bottom centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both named sites correspond to one built physical role each.

# src/props/AutoMovieArchetypeCargoPod.ts#AutoMovieArchetypeCargoPod.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the optional scene identity and allowed finite measurements.

## @evidence contracts/development/design.md#principled-representation

The named pod uses the original bands to define the faceted body and its two contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shares the saved dimensions without adding selectors to the fixed named factory.
