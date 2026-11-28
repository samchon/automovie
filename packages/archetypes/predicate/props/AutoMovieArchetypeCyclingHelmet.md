# src/props/AutoMovieArchetypeCyclingHelmet.ts#AutoMovieArchetypeCyclingHelmet.create

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the rim and crown poses, geometry-derived grasp span and unseeded shell size.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the rim-supported shell to the drawn dimensions. Its side hold is on the rim and the separate head socket is below the top by the foam allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws the shell dimensions once and places its fixed hold and wearing frames directly.

# src/props/AutoMovieArchetypeCyclingHelmet.ts#AutoMovieArchetypeCyclingHelmet.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Right rim `hold` and downward crown `wear` socket.

## @evidence contracts/development/design.md#principled-representation

The side grasp reads geometry, while the local crown seat places the helmet at its wear contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two stable IDs match the only physical handling and wearing sites.

# src/props/AutoMovieArchetypeCyclingHelmet.ts#AutoMovieArchetypeCyclingHelmet.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Shell width along X, front-to-back depth along Z and height along Y in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

The draw defines three orthogonal shell extents, and separately records the helmet mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the same four dimensions used by the shell geometry and body mass.
