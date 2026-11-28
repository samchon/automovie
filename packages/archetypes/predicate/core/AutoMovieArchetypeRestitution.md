# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.material

## @evidence contracts/development/common.md#meaningful-documentation

Names the impacting specimen's material as distinct from the stationary counterface.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.against

## @evidence contracts/development/common.md#meaningful-documentation

Names the stationary plate's material. The lookup uses that role separately from the impacting material.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.speed

## @evidence contracts/development/common.md#meaningful-documentation

Stores the measured normal approach speed in metres per second. Queries use an exact match.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.range

## @evidence contracts/development/common.md#meaningful-documentation

Keeps the measured minimum and maximum separation-to-approach ratios with the specific test.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.specimen

## @evidence contracts/development/common.md#meaningful-documentation

Records the mass, geometry or material details available for identifying the measured specimen.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement.source

## @evidence contracts/development/common.md#meaningful-documentation

Records the primary publication, section, table and address of the measurement.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

The fields identify both materials, metres per second, a dimensionless restitution range, the specimen and the publication.

## @evidence contracts/development/design.md#principled-representation

The material role and counterface fields keep the two sides distinct. The table freezes the rows and ranges from each published condition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A caller receives the full context required to compare its intended contact to each recorded specimen.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.MEASUREMENTS

## @evidence contracts/development/common.md#meaningful-documentation

Documents the source, exact speed, three included material rows and the ball-on-massive-plate conditions.

# src/core/AutoMovieArchetypeRestitution.ts#AutoMovieArchetypeRestitution.measurement

## @evidence contracts/development/common.md#meaningful-documentation

The function accepts a specimen material, counterface and speed in metres per second. It returns an immutable matching measurement or null.

## @evidence contracts/development/implementation.md#principled-implementation

Exact role and speed comparison returns only the measurement matching that test. Missing conditions produce null without interpolating a ratio or exchanging the material roles.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits at most the three published records. Each result is an immutable borrowed row or null.
