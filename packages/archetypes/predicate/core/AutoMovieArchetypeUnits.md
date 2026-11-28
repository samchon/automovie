# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.INCH

## @evidence contracts/development/common.md#meaningful-documentation

Specifies metres per international inch, used by recorded catalogue dimensions.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.FOOT

## @evidence contracts/development/common.md#meaningful-documentation

Specifies twelve international inches in metres.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.POUND

## @evidence contracts/development/common.md#meaningful-documentation

Specifies kilograms per international avoirdupois pound.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.OUNCE

## @evidence contracts/development/common.md#meaningful-documentation

Specifies one sixteenth of the international pound in kilograms.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.MILLIMETRE

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the one-thousandth conversion to metres for metric dimensions.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.CENTIMETRE

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the one-hundredth conversion to metres for metric dimensions.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.DEGREE

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the radians per degree used for trigonometry and geometric distances.

# src/core/AutoMovieArchetypeUnits.ts#AutoMovieArchetypeUnits.tyre

## @evidence contracts/development/common.md#meaningful-documentation

Defines the tyre designation's input units, result units and outer-diameter geometry.

## @evidence contracts/development/implementation.md#principled-implementation

The rim is measured in inches and each sidewall is the section width times aspect fraction. Adding two sidewalls to the converted rim gives the physical diameter in metres.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes both terms directly with a constant number of numeric operations and uses the existing unit constants for each input.
