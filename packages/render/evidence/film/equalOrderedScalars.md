# src/film/equalOrderedScalars.ts#equalOrderedScalars

## @evidence contracts/development/implementation.md#principled-implementation

A length check followed by a positional `Object.is` comparison is the definition of ordered-sequence equality over primitive leaves, applied once more for the single nesting level the matrix has; the premise that leaves are strings or numbers holds because the parameter type admits nothing else.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop handles both shapes, descending only where a position holds a row, instead of a general deep equality whose answer would also depend on prototypes and key order the callers never compare.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value or caller is special-cased; the non-array refusal is the stated domain boundary, not a compensation for a particular input.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the two compared shapes and their caller, the equality rule including order and type, the `Object.is` cases for `NaN` and signed zero, and what lies outside the domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in the total leaf count and stops at the first difference, with no allocation; every leaf must be read to prove equality, so no faster comparison exists.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison of two small arrays coordinates no phases or requests whose work could be shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function keeps no reference to its arguments after returning a boolean and opens no handle or task.
