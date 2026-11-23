# src/analysis/warnAutoMovieAnalysisTargetKeys.ts#warnAutoMovieAnalysisTargetKeys

## @evidence contracts/development/implementation.md#principled-implementation

Builds a `Set` of the reported keys and appends a warning for each declared target whose key is absent, so applicability is exact string equality between target and metric keys.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function shared by every analyzer, writing into the caller's sink, so a multi-run solver collects the warnings once and copies them to each run it emits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No metric or target key is special-cased; targets naming a metric that produced no value are deliberately left unwarned because that metric already reaches the report as a gap.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why an inapplicable target must be stated, the warning code and order, the deliberate exclusion of gapped metrics, and that `keys` is the union across a study's runs.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K + T) for K reported keys and T targets: one set build and one hashed lookup per target instead of a scan of the keys per target.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call checks one study's targets once; the envelope analyzer, the only multi-run caller, now calls it once and copies the result into both runs instead of repeating it per run.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The key set is call-local and released on return; the appended warnings, at most one per target, belong to the caller's sink.
