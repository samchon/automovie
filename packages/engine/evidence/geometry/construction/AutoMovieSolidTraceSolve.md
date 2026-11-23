# src/geometry/construction/AutoMovieSolidTraceSolve.ts#AutoMovieSolidTraceSolve

## @evidence contracts/development/common.md#meaningful-documentation

States the equations, face switches, dyadic proposal policy and separate numerical/work failure boundaries.

## @evidence contracts/development/design.md#principled-representation

Represents The meeting points of an intersection trace (`AutoMovieSolidIntersection`): Newton's method on the four equations `A(s, phi) = B(y, theta)` and the parameter law, on one host face or across an atlas's faces where the host point leaves one, each point's first and second rates in `t` by the implicit function theorem, and the continuation step from one point to the next with its halving: companion namespace of 9 members (`STEPS`, `HALVINGS`, `SWITCHES`, `solve`, `solveOn`, `jacobian`, ...); units and frames named in its text: newton, local, second, world, radians. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidTraceSolve` in packages/engine/src/geometry/construction/AutoMovieSolidTraceSolve.ts; its surface is the 9 members listed and the text shows 5 other files naming it, mostly packages/engine (3), test (2), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidTraceSolve.ts#AutoMovieSolidTraceSolve.solve

## @evidence contracts/development/implementation.md#principled-implementation

Backtracked Newton solves three meeting equations plus the selected law on actual owned charts. An exterior host proposal first uses the atlas's neighbour boundary foot as an initializer, whose actual residual must still descend; accepted meetings derive rates through a nonsingular Jacobian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The atlas loop owns face identity while solveOn owns one-face Newton and point owns the rate equations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the raw unscaled residual, tolerance and shared crossing budget. No exterior source is evaluated, and no mapped boundary foot is published without solving the meeting. Numeric unavailability is null; callback/binding errors propagate. Trim-kept checks remain separate from original chart ownership.

## @evidence contracts/development/common.md#meaningful-documentation

Gives chart guess order, parameter, starting face, local tolerance/failure semantics and the raw-residual/domain boundaries.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most five face Newton attempts each use up to 40 iterations with 20 trial halvings, plus a polish and two rate solves; atlas/surface/law callback costs are included rather than reduced to one jet per iteration.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses accepted jets/residuals during Newton and one Jacobian's values for the two rate systems, but factorization and arc-law callback readings are repeated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The atlas/iterate matrices and candidate points are synchronous call state; null releases local references, and a successful fresh point record borrows its accepted surface point vector and owns computed rates/vectors.

# src/geometry/construction/AutoMovieSolidTraceSolve.ts#AutoMovieSolidTraceSolve.advance

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same second-order chart/world prediction, corrected meeting and relative world-defect/tolerance acceptance. A low-defect accepted point permits a checked dyadic proposal recovery; this follows adaptive predictor/corrector continuation without assuming C3 source jets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One current point, signed proposal and consecutive-rejection counter remain local; one candidate counter bounds successful and failed solves together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither the residual nor the branch-distance allowance is relaxed. Nonfinite/nonadvancing parameters, failed halvings and the explicit work budget return null rather than publishing a partial endpoint; callback exceptions still propagate.

## @evidence contracts/development/common.md#meaningful-documentation

States the recovery heuristic, unchanged tolerance, rounding-policy difference and the distinction between representable progress, convergence and a product work budget.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 1024 shared atlas solves are attempted, including accepted substeps and rejected proposals. Low-defect recovery avoids retaining an unnecessarily small step through easier regions; each solve still includes all face, Newton, line-search, law and surface-callback costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current point's first/second chart rates and world jets supply the next predictor. The already measured world defect also selects the next proposal without evaluating another surface or adding a cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a constant number of local iterates/prediction arrays survive each iteration; success/null/throw releases call-local state. The attempt limit cannot bound an independently blocking callback, and no task handle is acquired.

# src/geometry/construction/AutoMovieSolidTraceSolve.ts#AutoMovieSolidTraceSolve.shifted

## @evidence contracts/development/implementation.md#principled-implementation

Adds declared periodic chart/parameter shifts while preserving the represented world point and derivative data; whole-period equivalence is the caller's premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Zero shift preserves object identity and a nonzero shift makes one shallow record with three changed scalar fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not re-evaluate geometry or prove the supplied shifts are periods of the surfaces/law.

## @evidence contracts/development/common.md#meaningful-documentation

Names host phase, part phase and trace-parameter offsets and the identity return for no shift.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work and at most one fixed-size record allocation avoid another meeting/rate solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All world vectors and rate arrays are shared with the original point under the declared periodic equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned reference/record; a shallow shifted point retains the original vector/rate arrays but no additional cache or handle.
