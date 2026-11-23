# src/fluid/simulateFluidDomain.ts#simulateFluidDomain

## @evidence contracts/development/implementation.md#principled-implementation

Uses an Arakawa C grid, free-surface pressure, implicit drag and donor-scaled upwind continuity. Admission, representable intermediate arithmetic and suitable depths are premises; design-depth Courant admission alone does not establish them, and floating-point balance/rest preservation is conditional rather than exact for arbitrary finite inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the step loop in the order momentum, sources and drains, limiter, ledger, continuity, with `faceSpeed` holding the one face rule both axes share, so the scheme reads in the order it runs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No domain or fixture is selected specially, but the nonpositive-depth ternary also hides NaN as zero, violating non-finite refusal. Derived clocks and ledger totals remain unchecked; the current finite scan covers only post-update depth and face velocities.

## @evidence contracts/development/common.md#meaningful-documentation

States the equations, omitted advection, boundary/limiter and activity/sill semantics, caller admission, conditional stability/replay properties and the exact finite-check gaps.

## @evidence contracts/development/implementation.md#efficient-algorithms

With C cells, F faces, S sources, D drains and n requested steps, replay costs O(C + F + n * (C + F + S + D)) time and O(C + F) storage. Every face/cell is updated and checked each step; final volume and fresh array copies still cost O(C + F) at step zero. Validated dimensions and n are count-bounded, not elapsed-time measurements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is reused across calls, so a caller that samples every frame of a shot pays a total quadratic in the steps; that is an unresolved limitation of the stateless contract `IAutoMovieFluidState` declares, and no production caller samples per frame today.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scratch arrays are call-local and become collectible after return or throw; no native handles or tasks are acquired. The caller owns fresh C depth and F velocity values in the result; copying overlaps scratch lifetime, and repeated results grow caller-held memory without an engine retention bound.
