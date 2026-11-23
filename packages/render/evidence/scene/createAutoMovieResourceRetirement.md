# src/scene/createAutoMovieResourceRetirement.ts#createAutoMovieResourceRetirement

## @evidence contracts/development/implementation.md#principled-implementation

Creates one lazily memoized Promise.allSettled completion, scheduling every operation independently through microtasks and reporting all rejections with an optional primary cause; callback settlement indicates public operation completion, not physical GPU/native retirement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns completion sharing and independent async fan-out, while reportAutoMovieResourceRetirement owns ordered failure flattening and resource owners retain actual handles through uncertain native release.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Repeated/reentrant requests share the original promise rather than retrying resource release or converting failure to success; no operation identity/fixture branch skips a requested attempt.

## @evidence contracts/development/common.md#meaningful-documentation

Documents lazy shared completion, independent starts, settlement-before-reporting, primary/aggregate identity policy and required owner retention after indeterminate native release.

## @evidence contracts/development/implementation.md#efficient-algorithms

Schedules R operations once and visits R settled results to report failures, O(R) coordinator references/promises plus actual operation costs; one pending operation delays final settlement but cannot prevent the other starts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All calls to one returned closer share exactly one in-flight/completed/rejected promise because they represent the same owned retirement; separate owners and operation lists have separate completions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closer retains its operation closures and completion for its own lifetime, so resource-owning closures must be bounded by the owner's population and released when that owner is unreachable; this coordinator acquires no resource or task beyond its finite retirement promises.
