# src/props/AutoMovieArchetypePhone.ts#AutoMovieArchetypePhone.create

## @evidence contracts/development/common.md#meaningful-documentation

States the upright axes, precise screen fractions, rear lens and band-default height.

## @evidence contracts/development/implementation.md#principled-implementation

The drawn rectangular case determines the rear grips and front plane. The screen takes 94 percent of its width and height, and the rear lens frame uses the back face and nine tenths of case height.

## @evidence contracts/development/implementation.md#efficient-algorithms

One dimension draw creates a single case and four fixed contact frames. Gripping geometry reuses the shared shallow-case helper.

# src/props/AutoMovieArchetypePhone.ts#AutoMovieArchetypePhone.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

States that the field has no admitted catalogue choices.

# src/props/AutoMovieArchetypePhone.ts#AutoMovieArchetypePhone.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names rear grip, lower pinch, centred front screen and rear lens.

## @evidence contracts/development/design.md#principled-representation

Both hand contacts span case thickness. The two facing contacts attach to distinct faces with opposite directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the four frames produced by the phone appear in its contact type.

# src/props/AutoMovieArchetypePhone.ts#AutoMovieArchetypePhone.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States metre geometry and kilogram mass.

## @evidence contracts/development/design.md#principled-representation

Bands provide the three extents and mass. The case and its surfaces share the drawn extents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the four device measurements for the case, contacts and body mass.

# src/props/AutoMovieArchetypePhone.ts#AutoMovieArchetypePhone.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States optional ID and applicable fixed band settings.

## @evidence contracts/development/design.md#principled-representation

Dimensions inherit the shared units and are admitted by the phone's bands. The catalogue field can remain omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the band's own physical and identification settings to the named factory.
