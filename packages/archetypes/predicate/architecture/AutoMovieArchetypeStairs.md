# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.create

## @evidence contracts/development/common.md#meaningful-documentation

States default steps and rails, the signed nosing sequence and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Each nosing shares the front of its supporting tread box; the final one begins the landing. Each selected bar follows the measured tread/riser slope.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructs one box and ledge per riser, the landing surface and four rods plus one bar per selected side.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.Rail

## @evidence contracts/development/common.md#meaningful-documentation

Defines which side labels apply while facing uphill.

## @evidence contracts/development/design.md#principled-representation

Four choices select one, both or neither of the two independently built sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller chooses the two rail positions through one closed field.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.RAILS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the accepted rail choices in their actual validation order.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.STEPS

## @evidence contracts/development/common.md#meaningful-documentation

States the authored maximum of 20 risers per flight.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.CLEARANCE

## @evidence contracts/development/common.md#meaningful-documentation

Defines the edge-to-outside rail gap in metres.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.EXTENSION

## @evidence contracts/development/common.md#meaningful-documentation

Defines the uphill level extension in metres from the last nosing.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.LANDING

## @evidence contracts/development/common.md#meaningful-documentation

Defines the cap applied to the top landing depth.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names all staged steps, the level landing and the optional sloped grip bars.

## @evidence contracts/development/design.md#principled-representation

Numbered ledges share the tread fronts facing downhill; the top surface and two possible uphill bars resolve separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One numbered sequence and three fixed names cover each kind of staged contact.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the units, occupancy width and sloping rail height reference.

## @evidence contracts/development/design.md#principled-representation

The rise and run locate every ledge, occupancy fixes width, the two rail figures locate the grip and mass scales by riser count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model records the dimensions needed to reconstruct flight and rail geometry.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Separates the length measurements from the kilograms per riser.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.Occupancy

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the width class on each side of the 50-occupant threshold.

## @evidence contracts/development/design.md#principled-representation

The two labels select the stored widths 0.914 m and 1.118 m.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One occupancy value selects a width without opening a separate width override.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.OCCUPANCIES

## @evidence contracts/development/common.md#meaningful-documentation

States both metre widths and which class is the seedless default.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains how count, rails, occupancy, ID and dimensions affect creation.

## @evidence contracts/development/design.md#principled-representation

The count creates repeated steps, occupancy provides the width and the remaining free dimensions pass through their bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Width stays under the occupancy choice while count, sides, ID and free measurements remain authorable.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.IParams.occupancy

## @evidence contracts/development/common.md#meaningful-documentation

Describes seed selection and the `under50` fallback.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.IParams.steps

## @evidence contracts/development/common.md#meaningful-documentation

States the integer limits, default and inclusion of the final rise.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.IParams.rail

## @evidence contracts/development/common.md#meaningful-documentation

Defines the viewpoint for side labels and the default of both rails.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the unique scene ID and default `stairs`.

# src/architecture/AutoMovieArchetypeStairs.ts#AutoMovieArchetypeStairs.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Records all five free ranges with units and inclusive endpoints.
