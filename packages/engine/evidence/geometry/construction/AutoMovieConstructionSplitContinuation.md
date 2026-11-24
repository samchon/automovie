# src/geometry/construction/AutoMovieConstructionSplitContinuation.ts#AutoMovieConstructionSplitContinuation.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Names the retained direction, actual rail reach in millimetres, sampled starting velocities and optional angular and station support.

## @evidence contracts/development/design.md#principled-representation

Records the source chart's signed retained side and measured directions together with the admitted physical reach. Optional open-arc addresses select its fitted clock field. Optional station room and angle bound the domain of that same chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only the geometry that the child continuation uses to prepare its direction fields and bound reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The direction and reach are supplied by the original rail. Their source frames and supported range remain explicit in the input.

# src/geometry/construction/AutoMovieConstructionSplitContinuation.ts#AutoMovieConstructionSplitContinuation.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Names the original child, the rail and phase maps and their derivatives, and the admitted retained material. Returns a surface 2-jet reader or refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the source's first fundamental form for each supplied start direction. The inward component is positive in the straightened chart. At reflected nodes 0, 1/2 and 1 the weights 6, -8 and 3 have moments 1, -1 and 1, preserving the required edge 2-jet. A rational cross coordinate preserves the zero-station derivatives and limits the retained reads. [Hestenes](https://doi.org/10.1215/S0012-7094-41-00812-8)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates direction decomposition, fixed interpolation and radius preparation, then applies the analytic chart chain rule to the original surface jet at each retained address.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses degenerate parent jets, directions outside the retained side and a nonpositive supported interval. The interval comes from the domain and bounded spline controls. The returned reader uses source derivatives only at retained addresses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares one source jet per supplied phase. A query evaluates one source jet on the rail or three away from it, plus the two prepared field reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One pair of prepared directional fields and their admissible radius serve all changing cross and clock queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader borrows the original source and rail and retains its prepared field coefficients. Per-query jets are local.
