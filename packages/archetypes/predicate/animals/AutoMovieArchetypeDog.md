# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.create

## @evidence contracts/development/common.md#meaningful-documentation

States required mass, seedless Pet timing and the two collar-width rules.

## @evidence contracts/development/implementation.md#principled-implementation

The cohort supplies both proportions from one row. The neutral rig seats its ears and optionally mounts one fitted collar and lead.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one selected rig and its ears once, skipping tack geometry for a bare dog.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Places the one optional `lead` rein on the real shaft.

## @evidence contracts/development/design.md#principled-representation

The rein frame and aperture match the midpoint and diameter of the drawn lead.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One contact name covers the available tack interaction.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.ICollar

## @evidence contracts/development/common.md#meaningful-documentation

Defines the optional fitting dimensions using the shared metre contract.

## @evidence contracts/development/design.md#principled-representation

The collar width lies along the neck; shell thickness, lead length and radius define the real parts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dog reuses the four dimensions required by the shared collar geometry.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States required whole-model mass and the effects of optional cohort, tempo and tack.

## @evidence contracts/development/design.md#principled-representation

Cohort selection precedes rig and fitting generation. Tempo tunes the stride clock and mass covers all built parts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries one mass plus only the available ID, cohort, tempo and tack controls.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the default scene identity `dog`.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams.mass

## @evidence contracts/development/common.md#meaningful-documentation

Requires positive finite total kilograms including fitted tack.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams.cohort

## @evidence contracts/development/common.md#meaningful-documentation

Identifies whole-cohort sampling and the seedless Pet choice.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams.tempo

## @evidence contracts/development/common.md#meaningful-documentation

Gives the admitted displacement interval in standard deviations.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.IParams.collar

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the collar/lead option from the bare factory route.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.REFERENCE

## @evidence contracts/development/common.md#meaningful-documentation

Identifies 22 kg as an explicit gallery input, separate from cohort dimensions.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Names each physical measurement's unit and the dimensionless tempo.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.MODELS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the two measured numbers kept together and the seedless pair.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.TEMPO

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive window and zero midpoint with the recorded timing source.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.NECK_LENGTHS

## @evidence contracts/development/common.md#meaningful-documentation

Defines the neutral landmark distances used by named and unrestricted fit.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.COLLAR_DIMENSIONS

## @evidence contracts/development/common.md#meaningful-documentation

Lists all four fields read before fitting the collar and lead.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.positive

## @evidence contracts/development/common.md#meaningful-documentation

States the dimension and unit, the optional inclusive ceiling and refusal cases.

## @evidence contracts/development/implementation.md#principled-implementation

The helper reports the supplied field, value and feasible bound through the dog refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Checks finiteness and positivity before applying the optional bound. The helper uses the supplied scalar directly.

# src/animals/AutoMovieArchetypeDog.ts#AutoMovieArchetypeDog.collar

## @evidence contracts/development/common.md#meaningful-documentation

Names the neck landmarks and the lead contact emitted for a dog.

## @evidence contracts/development/implementation.md#principled-implementation

The helper passes the same rig and tack to the shared collar owner with dog refusal and contact identities.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shared construction call performs the fitting and avoids rebuilding the rig.
