# src/props/AutoMovieArchetypeLantern.ts#AutoMovieArchetypeLantern.create

## @evidence contracts/development/common.md#meaningful-documentation

The `grip` and `hook` share the bail wire centre. The upward `light` socket is at the burner below the translucent globe.

## @evidence contracts/development/implementation.md#principled-implementation

The bail uses three fixed wire segments above the floor-supported body, while the burner socket sits at the globe's base.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one lantern row and makes three body pieces, three wire spans and three contact frames.

# src/props/AutoMovieArchetypeLantern.ts#AutoMovieArchetypeLantern.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

An upper bail `grip` and `hook`, plus upward `light` at the globe base.

## @evidence contracts/development/design.md#principled-representation

The grip and hook share one raised bail location, while the burner remains inside the translucent globe.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two mounting actions and emitter attachment each have a distinct stable ID.

# src/props/AutoMovieArchetypeLantern.ts#AutoMovieArchetypeLantern.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Base and globe diameters, globe height, body height and raised-bail height in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

Separates model body height from raised-bail height and globe height from globe diameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the physical amounts supplied for this body and handle assembly.

# src/props/AutoMovieArchetypeLantern.ts#AutoMovieArchetypeLantern.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Optional ID, finite base and globe diameters, globe, body and bail heights in metres, and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

A narrow recipe supplies the six measured lantern quantities and scene ID with metre or kilogram units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Selects the applicable record keys from the saved light shape.
