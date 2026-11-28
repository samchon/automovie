# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.create

## @evidence contracts/development/common.md#meaningful-documentation

States the rear-origin frame, working depth, chosen width and default top.

## @evidence contracts/development/implementation.md#principled-implementation

The catalogue sets width and a band sets height. The front slab extends from the equipment body's recess to the forward edge. End panels leave the middle below the work top clear. Both contact heights use the slab top.

## @evidence contracts/development/implementation.md#efficient-algorithms

A size pick and one band draw produce four boxes and two contacts. The rear and front dimensions are shared across the solids and frames.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Defines centre and forward edge of the same working slab.

## @evidence contracts/development/design.md#principled-representation

The `surface` contact uses the slab's centre and its measured width and depth. The `edge` contact uses the +Z boundary at that same height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The work plane and forward ledge expose the actual support area without adding controls.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines catalogue width, worktop height and the body's mass in their units.

## @evidence contracts/development/design.md#principled-representation

Width spans all parts along X, height sets the top and the free measured mass sets the body's property.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Catalogue dimensions and band dimensions are represented under their existing shared unit record.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies metres for geometry and kilograms for body mass.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.Size

## @evidence contracts/development/common.md#meaningful-documentation

Names catalogue widths as inch designations.

## @evidence contracts/development/design.md#principled-representation

Each discrete inch label maps to one catalogue width recorded in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One catalogue name owns width without duplicating it as a fixed scalar.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.SIZES

## @evidence contracts/development/common.md#meaningful-documentation

States the widths in their selection order and their unit conversion.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the named size and the optional author settings.

## @evidence contracts/development/design.md#principled-representation

The closed size chooses width from the catalogue and finite fixed height and mass values stay within their bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Caller settings expose only the three geometry and mass controls the production can author.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.IParams.size

## @evidence contracts/development/common.md#meaningful-documentation

Names the catalogue width with its first-entry fallback.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID and `console` default.

# src/furniture/AutoMovieArchetypeConsole.ts#AutoMovieArchetypeConsole.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the two adjustable values from the model-owned width.
