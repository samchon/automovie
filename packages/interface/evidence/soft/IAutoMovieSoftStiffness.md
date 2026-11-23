# src/soft/IAutoMovieSoftStiffness.ts#IAutoMovieSoftStiffness

## @evidence contracts/development/design.md#principled-representation

The Jacobi solver multiplies each distance correction by its family weight and divides the gathered result by particle valence; validateSoftBodyDomain requires finite weights in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three scalar weights correspond directly to the supported neighbour families without a material-law abstraction the current solver does not evaluate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These values are relaxation weights rather than physical elastic moduli; increasing them does not certify inextensibility at a finite sweep count.

## @evidence contracts/development/common.md#meaningful-documentation

Member comments identify structural, diagonal and second-neighbour responsibilities and their dimensionless range.
