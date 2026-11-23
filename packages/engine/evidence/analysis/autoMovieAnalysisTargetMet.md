# src/analysis/autoMovieAnalysisTargetMet.ts#autoMovieAnalysisTargetMet

## @evidence contracts/development/implementation.md#principled-implementation

A closed comparison against the inclusive bound the target's direction names, which is the definition of `meets` the run contract uses, so the builder and the validator derive one verdict from one expression.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate owns the verdict rule that `autoMovieAnalysisMetric` applies when it builds a metric and `validateAutoMovieAnalysisRunContents` applies when it re-derives one, so the two cannot drift apart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or unit conversion is applied and no key is special-cased; any value other than `at-least` is read as `at-most`, which is sound because both callers pass the closed `AutoMovieAnalysisComparison` union after targets have been checked.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both inclusive directions, that equality meets, the same-unit premise, and what the boolean means.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One comparison with no algorithm, data structure or strategy to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar predicate that coordinates no work across requests or phases.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing and owns no handle.
