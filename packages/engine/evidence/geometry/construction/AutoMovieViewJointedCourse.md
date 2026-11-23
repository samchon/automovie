# src/geometry/construction/AutoMovieViewJointedCourse.ts#AutoMovieViewJointedCourse

## @evidence contracts/development/common.md#meaningful-documentation

States arclength units, angle derivatives, zero derivatives on straight runs and the numerical origin-value boundary.

## @evidence contracts/development/design.md#principled-representation

Represents The admitted jointed course's Rodrigues transport and analytic frame jets: companion namespace of 6 members (`ITurn`, `ICourse`, `prepare`, `create`, `ISample`, `integrate`); units and frames named in its text: frame, radians, local, second. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieViewJointedCourse` in packages/engine/src/geometry/construction/AutoMovieViewJointedCourse.ts; its surface is the 6 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieViewJointedCourse.ts#AutoMovieViewJointedCourse.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Finite separated centres give normalized segments; atan2 determines nonzero turns and the original tangent integral gives each bisector setback before overlap admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation owns direction/turn geometry, lengths and arclength placements for both frame and run queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing opposite-direction conditioning limit and refuses negative/nonfinite halves or overruns; no turn is shortened or thresholded to zero.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs and failures use kernel mm; exact straight joints consume zero setback and turn length.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear centre passes plus fixed Gauss quadrature for each nonzero turn require O(C) output and scratch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each nonzero turn's full displacement is integrated once in this preparation and shared by its setback and placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Failure releases local arrays; success transfers the finite prepared arrays to the caller without global retention.

# src/geometry/construction/AutoMovieViewJointedCourse.ts#AutoMovieViewJointedCourse.create

## @evidence contracts/development/implementation.md#principled-implementation

Integrates the quintic-angle tangent for the origin and reads exact analytic T, theta-prime and theta-double-prime for the frame derivatives; p-prime=T and p-double-prime=theta-prime times axis-cross-T.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The at and jet callbacks share one evaluator and therefore the same source value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Straight runs use zero angular velocity; no knot resampling, shortened turn or endpoint finite difference changes the course.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are admitted immutable mm course data; station derivatives describe the analytic curve whose value is evaluated by fixed quadrature.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each read visits at most all turns with fixed quadrature panels and constant-size jet storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both callback modes share the same admitted direction/turn arrays and the same evaluator; independent queries do not cache or share mutable output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The axis closure borrows its first origin/direction, chart axis and turns for its lifetime; caller mutation is unsupported and returned jets own their vectors.

# src/geometry/construction/AutoMovieViewJointedCourse.ts#AutoMovieViewJointedCourse.integrate

## @evidence contracts/development/implementation.md#principled-implementation

Preserves composite ten-point Gauss-Legendre quadrature on eight panels for the original Rodrigues/quintic-angle integrand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same integral computes both prepared setbacks and query origin values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original nodes, panels and arithmetic order without a fitted displacement or unproved exactness guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

Tangent is unit, turn is admitted and length/output are mm; the numerical integral approximates the analytic curve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight panels times ten nodes gives fixed work and fixed live-vector storage per integral.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller reuses full-turn results for setbacks; this pure evaluation retains no query cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All quadrature vectors are call-local and only the displacement triple escapes.
