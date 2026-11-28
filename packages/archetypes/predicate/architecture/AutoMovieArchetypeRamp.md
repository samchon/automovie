# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the staged slope, real slab toe, landing, seedless fit and refused inputs.

## @evidence contracts/development/implementation.md#principled-implementation

Rise divided by slope gives the nominal run. The inclined and level faces meet at one `top` ledge while the slab starts above the floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds three boxes and three contacts from closed-form run, normal and length.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.LANDING

## @evidence contracts/development/common.md#meaningful-documentation

Gives the fixed top landing depth of 1.525 m.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the complete nominal slope, uphill edge and horizontal landing.

## @evidence contracts/development/design.md#principled-representation

The inclined contact uses its normal, the edge faces downhill, and the landing is level above the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three contacts cover the travel surface, the transition and the end platform.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the slope ratio and the units and reference of the other three dimensions.

## @evidence contracts/development/design.md#principled-representation

Rise and slope determine run, width spans the crosswise face and mass applies to the full body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four values describe the ramp while the landing depth belongs to the factory constant.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Matches slope, height, width and mass to their validation units.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States how to fix dimensions and leave the rest to a seed or midpoint.

## @evidence contracts/development/design.md#principled-representation

The authored ID and each optional measurement go directly to the ramp builder and draw session.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs expose the four drawn measurements and ID while keeping a fixed landing depth.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the stable fallback ID `ramp`.

# src/architecture/AutoMovieArchetypeRamp.ts#AutoMovieArchetypeRamp.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive slope, rise, width and whole-mass intervals.
