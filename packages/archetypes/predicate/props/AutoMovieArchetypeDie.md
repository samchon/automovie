# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.create

## @evidence contracts/development/common.md#meaningful-documentation

States the plastic cube's pose, exact side and upper gripping span.

## @evidence contracts/development/implementation.md#principled-implementation

One measured cuboid supplies the rest and upper positions, using its actual side for the pinch.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one box then delegates its three contact frames to the shared stack helper.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.IDie.mass

## @evidence contracts/development/common.md#meaningful-documentation

Gives the die's estimated weight in kilograms.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.IDie.side

## @evidence contracts/development/common.md#meaningful-documentation

Gives the fixed length of all three cube axes.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable default scene identity.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Upper precision `grip` and `top` socket, with a `base` socket on the resting face.

## @evidence contracts/development/design.md#principled-representation

The die's actual resting and upper planes supply the two sockets, and the pinch matches its side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the three exact contact IDs for placement and pickup.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Cube side in metres and estimated whole mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

One edge length defines all cube extents and the model records one mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed cube has exactly two recorded physical amounts.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.IDie

## @evidence contracts/development/common.md#meaningful-documentation

The fixed cube side and estimated mass.

## @evidence contracts/development/design.md#principled-representation

The fixed body is one cube with a separate estimate for mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The size record contains the two values its factory uses.

# src/props/AutoMovieArchetypeDie.ts#AutoMovieArchetypeDie.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID as the authored option.

## @evidence contracts/development/design.md#principled-representation

The stable recipe owns geometry and mass, so a caller can distinguish instances through its ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameter type contains one optional scene identity.
