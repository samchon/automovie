# src/actions/walkReachFeet.ts#walkReachFeet

## @evidence contracts/development/common.md#meaningful-documentation

States which endpoints are ready, why inactive ones can be deferred and what completes them.

## @evidence contracts/development/implementation.md#principled-implementation

Demand changes only when the original final stance fit runs; reading an inactive endpoint or contact completes that same side's independent fixed-root fit before returning its exact value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each side's endpoint/contact getter pair shares one completion guard over the root solver's own output records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No endpoint is approximated or replaced, and a failed fit publishes no completed guard.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant getter overhead; a query that consumes only bearing endpoints performs no inactive final fit, while a boundary reader fits each actually requested inactive side at most once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every getter belongs to one fixed final root and its unchanged scheduled feet, sharing only that root's exact completed stance work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One returned ground result retains two endpoint records, bearing flags, two completion bits and one callback until the query releases it; it retains no time history or global entry.
