# src/geometry/construction/AutoMovieSolidExactBlend.ts#AutoMovieSolidExactBlend.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Names the original chart owner and the admitted anchors used by the returned phase readers. The mixed join must already be admitted. World points and transverse stations are in millimetres, and phase is in radians.

## @evidence contracts/development/implementation.md#principled-implementation

Fits periodic chart coordinates and transverse directions through the admitted anchors for each original surface. Nearest-period lifts give each closed rail one continuous chart. The lift rejects a half-period ambiguity or a circuit that does not close on its starting sheet. The source jet evaluates the value and transverse two-jet within its owned chart. The world chord sets both transverse scales. A finite positive scale and nonzero chart and ribbon tangents are required. [Hartmann, section 11.3](https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdgen.pdf)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the chart lines once. One paired reader evaluates both source jets and makes the ribbons for the continuous surface and trim records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The prepared lines carry the admitted chart anchors. Each ribbon reads its original surface jet and refuses missing or singular values.

## @evidence contracts/development/implementation.md#efficient-algorithms

The coordinate lift and four periodic interpolations depend on the anchor count. A phase read evaluates the fixed local cubic supports and two original source jets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call owns four fitted coefficient arrays. The angular reader returns one paired ribbon that the transverse station reader uses directly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned preparation owns its interpolation coefficients and source references for one blend realization. Each phase read releases its jets with its result.

# src/geometry/construction/AutoMovieSolidExactBlend.ts#AutoMovieSolidExactBlend.adaptive

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the shared angular partition and its owning rail and ribbon consumers.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the original anchor phases. An interval is halved where the maximum physical midpoint chord error exceeds the requested deflection across the sampled ribbon. The worst transverse midpoint error scales the transverse count using the leading quadratic relation between step and chord error. The world coordinate norm and binary64 spacing establish the admissible deflection floor. [Open CASCADE Technology mesh guide](https://dev.opencascade.org/doc/overview/html/occt_user_guides__mesh.html)

## @evidence contracts/development/implementation.md#efficient-algorithms

An interval hands its midpoint and endpoint position reads to its halves. Every evaluated midpoint supplies all transverse probes in that angular column. The output contains one phase list and a transverse row count.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Local midpoint observations determine tessellation demand. Both incident surfaces keep their original chart and analytic boundary values. Strict mesh crossings and surface continuity have separate verification.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adaptive partition supplies both trim cycles and the continuous blend. The transverse estimate uses the same evaluated columns.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Adjacent intervals share their endpoint reads. Recursion carries one evaluated midpoint to both halves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller retains the resulting phase list and row count. Temporary probes stay on the recursion path and are released as their intervals finish.

# src/geometry/construction/AutoMovieSolidExactBlend.ts#AutoMovieSolidExactBlend.discretize

## @evidence contracts/development/common.md#meaningful-documentation

Identifies sampled native rail metadata as the output and the original loft metadata as the retained span and topology owner.

## @evidence contracts/development/implementation.md#principled-implementation

Reads both native rails and the declared widths at each shared angular phase. Keeps the blend's original span and source metadata.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One paired column reader supplies the trim chart coordinates, world intersection and both side directions for every corresponding sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each recorded sample is evaluated on its original surface. A missing column refuses the whole partition before it enters the body's trim state.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates each requested phase once. The output arrays and correspondence work grow linearly with the phase count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both trim cycles and the corresponding ribbon records share the phase list and use the paired rail read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned phase-aligned records for the blend's lifetime. A refused build publishes no partial records.

# src/geometry/construction/AutoMovieSolidExactBlend.ts#AutoMovieSolidExactBlend.surface

## @evidence contracts/development/common.md#meaningful-documentation

States exact native transverse two-jets and the lifetime of the phase-bound readers.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the quintic Hermite ribbon from the two owned source jets at each angular address. Transverse station derivatives scale from the normalized ribbon parameter by the retained physical length. Centered angular differences use a binary64 balance estimate for the second derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One continuous surface publishes both the normal jet reads and the phase-bound readers used by grid tessellation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each angular read evaluates the two owned chart curves. The station endpoint and its transverse derivative come from the incident original surface.

## @evidence contracts/development/implementation.md#efficient-algorithms

A position column binds one original ribbon and a jet column binds three. The station reader applies fixed-size Hermite and finite-difference evaluations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The tessellator reuses each angular preparation across that column's stations during the same evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The surface and its prepared column readers share inputs from one realization. No angular results survive the lifetime of the corresponding readers.
