# src/analysis/analyzeAutoMovieSpaceAir.ts#analyzeAutoMovieSpaceAir

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the well-mixed single-zone balance in closed form (air change rate, outdoor air per person, steady-state carbon dioxide), whose premise is uniform concentration in the zone, and reports velocity and stagnation as `unsupported` because a zone model has no flow field.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function validates, evaluates five metrics through the shared metric builder and seals one run; the request check is a private helper because only this analyzer reads a ventilation request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null flow, a zero flow and zero occupancy each produce a named gap instead of a substituted value, and the zero-flow reason is chosen from whether anything generates carbon dioxide rather than assuming an occupied space.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the three closed forms, why velocity and stagnation are unsupported, both zero-flow cases, the throwing inputs and that the run is always solved without samples.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant arithmetic for five metrics plus target validation and matching linear in the declared targets, with no algorithm or strategy to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One request yields one run; nothing it computes serves another request or phase.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Builds five metrics, a warning list and one settings string for the sealed run and retains nothing after returning it.
