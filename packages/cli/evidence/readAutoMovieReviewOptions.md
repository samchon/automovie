# src/index.ts#readAutoMovieReviewOptions

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates every option with its meaning and absent value, and states every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A review records the page a person would watch, so the command names that page and how long to watch it; only a loopback address is admitted, so the command never drives a page elsewhere.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass admitting the listed options, then the checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No address or duration is guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the options.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per command.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and keeps nothing.
