# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the model-selected width and length, default Alltub model, cap travel and fixed dispensing contact.

## @evidence contracts/development/implementation.md#principled-implementation

A tube diameter sets cylinder geometry and selects its applicable length range. The cap control carries only the circular cap, while the nozzle is fixed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Picks one catalogue record and one length range, then builds a body and cap with three local contacts.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the stable scene ID default shared with saved recipes.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.IParams.length

## @evidence contracts/development/common.md#meaningful-documentation

Explains that the selected diameter owns the admissible length.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.IParams.mass

## @evidence contracts/development/common.md#meaningful-documentation

States kilograms and that the tube mass comes from the applicable finite band.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names the Alltub catalogue owner and seedless default row.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the body grip, cap rotation and fixed axial nozzle as distinct roles.

## @evidence contracts/development/design.md#principled-representation

The circular cap spins about its longitudinal axis, and the dispensing socket remains on the original axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These names correspond to the actual grasp, knob and nozzle needed by a tube action.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States axial length, body diameter and mass in their physical units.

## @evidence contracts/development/design.md#principled-representation

The coupled Alltub diameter and length use metres, with mass drawn separately in kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three keys record the dimensions and weight applied to the two tube parts.

# src/props/AutoMovieArchetypeSqueezeTube.ts#AutoMovieArchetypeSqueezeTube.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the ID, model choice and two authorable measurements.

## @evidence contracts/development/design.md#principled-representation

The model couples width with length admission. The independent mass and identity remain optional.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Leaves width owned by the selected catalogue and exposes the remaining authorable settings.
