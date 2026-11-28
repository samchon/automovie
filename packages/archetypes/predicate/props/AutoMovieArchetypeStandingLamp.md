# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.create

## @evidence contracts/development/common.md#meaningful-documentation

Locates the upright solids, shade grip and stem socket, and states the default heights for both forms.

## @evidence contracts/development/implementation.md#principled-implementation

The stem establishes socket height and the measured overall height establishes shade placement. The base and stem share the remainder after allocating shade mass.

## @evidence contracts/development/implementation.md#efficient-algorithms

One dimensional draw produces three coaxial rods and two contact frames, with a closed-form distribution of part mass.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the required table or floor selector and the geometry it controls.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

States the two valid variants in stable gallery order.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shade hold and upward emitter socket separately.

## @evidence contracts/development/design.md#principled-representation

The grip at mid-shade and the socket at the lampholder height attach to distinct frame positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the actual two contact IDs built for both standing variants.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the geometric units and distinguishes overall, stem and shade heights.

## @evidence contracts/development/design.md#principled-representation

Separate height measurements locate the base, shade and socket. The two diameters describe the base and shade widths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the six measurement keys applicable to these standing constructions.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the required kind and the settings admitted for the standing forms.

## @evidence contracts/development/design.md#principled-representation

The selector fixes which body's band record supplies height, diameter and mass admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the saved geometry inputs narrowed to standing-specific quantities and an identity.

# src/props/AutoMovieArchetypeStandingLamp.ts#AutoMovieArchetypeStandingLamp.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two standing-lamp shapes and how they select measurement records.

## @evidence contracts/development/design.md#principled-representation

Both forms share the same construction. The kind distinguishes table and floor size, mass and shade dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two literals represent the two admitted standing alternatives while sharing one physical builder.
