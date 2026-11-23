# src/architecture/validateBuiltConnectorLandings.ts#validateBuiltConnectorLandings

## @evidence contracts/development/implementation.md#principled-implementation

Landings are an ordered set of interior stations along a parameterized route, so they must be unique, interior to the open unit interval, and strictly increasing, which is what lets every stop query read them in route order without sorting.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The landing rule of connector validation in one function, separated from `validateBuiltEnvironment`; `builtConnectorStops` relies on the order it enforces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No landing is re-sorted or deduplicated, and the open interval follows from the endpoints already being stops rather than from any one connector.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why each rule exists, the interval and its openness, the order rule, the path, and the skip for a run without landings.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the landings with a seen set, linear in their count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A check of one run per call; each connector is checked once per validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The seen set is released on return; at most a few violations per landing are appended to the caller's collector.
