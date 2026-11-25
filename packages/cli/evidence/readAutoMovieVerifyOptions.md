# src/readAutoMovieVerifyOptions.ts#readAutoMovieVerifyOptions

## @evidence contracts/development/common.md#meaningful-documentation

States the tokens, admitted workload, status mode and required-stage behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The shared Node option reader admits named scalar and repeatable flags before any production module loads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Module and gate options share single-value validation, and one choice set per repeatable field preserves request order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Blank arguments or repeated single-value options refuse. Any gate still reads all of its required checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

One parse and one set per repeated group use linear time and space in the argument population.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The request is admitted once for one command; each invocation receives fresh option arrays.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The reader returns the options and acquires no handles.
