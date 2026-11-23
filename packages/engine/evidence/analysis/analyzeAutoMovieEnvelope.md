# src/analysis/analyzeAutoMovieEnvelope.ts#analyzeAutoMovieEnvelope

## @evidence contracts/development/implementation.md#principled-implementation

Solves the one-dimensional steady-state series resistance network per assembly, derives interior surface temperature and temperature factor from it, adds psi-times-length bridges to the fabric loss, and judges condensation against the Magnus dew point from `autoMovieDewPoint`, whose fitted temperature range is not enforced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the solve and both runs' metrics; request checking and instant resolution live in `resolveAutoMovieEnvelopeRequest`, the dew point in `autoMovieDewPoint`, and metric building, target warnings and sealing are shared analysis helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No exterior temperature, humidity or material value is substituted: missing inputs give `not-run` runs or gaps, interstitial condensation and solar gain are `unsupported` metrics, and reverse heat flow is reported as a warning rather than corrected.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why there are two runs, the network equations and the dew-point source, the unsupported exclusions, the `not-run` case, the unenforced fitted range and the throwing inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in assemblies A (at most 4096), their layers and bridges, plus metrics times targets for target lookup; the A bound keeps the spread `Math.min` and `Math.max` calls within engine argument limits.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solves each assembly once for both runs' metrics and samples, computes one dew point for every margin, builds one settings string for both seals, and collects the unknown-target warnings once and copies them into both runs, since both runs report against the same union of keys.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates per-call arrays proportional to A and keeps none of them after returning the two runs, which own their metrics, samples and warnings.
