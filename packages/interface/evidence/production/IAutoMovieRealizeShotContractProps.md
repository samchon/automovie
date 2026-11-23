# src/production/IAutoMovieRealizeShotContractProps.ts#IAutoMovieRealizeShotContractProps

## @evidence contracts/development/design.md#principled-representation

Names exactly the inputs the grade reads, so the two call sites are checked by the compiler against one declaration instead of each matching an anonymous parameter shape; the optional `frameFormat` and `skeleton` exist because the source-stage caller has no production object and no attached models, which is the real difference between the two moments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record with no defaults of its own: the production's raster wins over `frameFormat`, a model's rig wins over `skeleton`, and those precedences are applied where they are read, in the subject reader and the camera grade.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries no field for a specific caller, test or fixture; `collisions` is the builder's own finding about formation slots passed through to the grade so it fails the same diagnostic channel.

## @evidence contracts/development/common.md#meaningful-documentation

States both producers and when each calls, which field wins when two could answer, what a `null` or omitted field means for the grade, and that nothing is mutated.
