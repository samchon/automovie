# src/render/inspection/IAutoMovieInspectionSweepProps.ts#IAutoMovieInspectionSweepProps

## @evidence contracts/development/design.md#principled-representation

It preserves source order and does not own scene objects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

expandAutoMovieInspectionSweep exchanges objects, pattern, margin; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It preserves source order and does not own scene objects.

## @evidence contracts/development/common.md#meaningful-documentation

World-space object boxes and a path pattern for isolating inspection units. expandAutoMovieInspectionSweep validates finite ordered bounds and a finite nonnegative margin, selects topmost matching units, and throws if the pattern matches none. The prose and members document how expandAutoMovieInspectionSweep interprets and admits these values.
