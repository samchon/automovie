# src/props/AutoMovieArchetypeHat.ts#AutoMovieArchetypeHat.create

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the model pose, brim pinch, crown socket and seedless dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

The brim and crown use distinct circular footprints. The pinch closes across brim thickness and the wearing socket sits just below crown top.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one hat recipe and creates two coaxial cylinders and two contact frames.

# src/props/AutoMovieArchetypeHat.ts#AutoMovieArchetypeHat.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Right-side brim `hold` and downward crown `wear` socket.

## @evidence contracts/development/design.md#principled-representation

The brim is held toward the outer right edge, while the crown frame fits the head location below the top.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two actual contacts distinguish holding and wearing.

# src/props/AutoMovieArchetypeHat.ts#AutoMovieArchetypeHat.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Brim diameter as width, crown diameter as depth and height in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

The saved width and depth map to separate round brim and crown diameters. Height controls the top on Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four keys record the measurements and mass used by this fixed hat form.
