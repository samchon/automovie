# src/geometry/construction/AutoMovieConstructionPortBand.ts#AutoMovieConstructionPortBand.create

## @evidence contracts/development/implementation.md#principled-implementation

Each column's cross speeds are the column strip's ribbons (factor times chord over the side's speed along its direction), joined by the periodic cubic; the surface is the Hartmann blend of the host read inside the port curve and the part reflected across its rail from its kept side, its jets by the chain rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Column values, clock fields, admission, then one jet reader built from one side reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a correspondence whose derivative reaches zero, a cross speed whose controls reach zero and a reading outside a side's domain, each bound from the fields' controls over each column span rather than from samples.

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) to prepare; a jet reads one host and three part jets, fewer on a seam.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The clock fields are prepared once for every reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The surface retains the two sides, the curve and four fields.

# src/geometry/construction/AutoMovieConstructionPortBand.ts#AutoMovieConstructionPortBand.carried

## @evidence contracts/development/implementation.md#principled-implementation

The two strips share their rail layers, so their difference vanishes with its cross 2-jet at both rails at every column and the carried band keeps the exact band's seams; every jet is the sum of the three surfaces' own jets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One jet reader over three readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No derivative is approximated and no depth is refitted; between columns the displacement at the rails is the two strips' interpolation difference, which the exact seams' readers do not consult.

## @evidence contracts/development/common.md#meaningful-documentation

States the three surfaces and what the sum keeps.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three jets per reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The surface retains the three surfaces.

# src/geometry/construction/AutoMovieConstructionPortBand.ts#AutoMovieConstructionPortBand.sigma

## @evidence contracts/development/common.md#meaningful-documentation

States the rational cross parameter and the order of its returned derivatives. The band passes a dimensionless cross share from 0 to 1.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the quotient rule twice to the band's rational cross map. The denominator has negative discriminant and positive leading coefficient, so each quotient is defined throughout the band's cross interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Names the numerator, denominator and their first derivatives before evaluating the value and its derivatives in one function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the analytic derivatives of the same cross map used for the read parameter. The computation introduces no clamps or finite differences.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates fixed-degree polynomials and returns three scalars in constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The value and both derivatives share the evaluated numerator and denominator. Both derivatives share their evaluated first derivatives.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns a fresh scalar tuple and retains no references.
