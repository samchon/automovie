# src/populationRuntime/compiledPopulationRepresentation.ts#compiledPopulationRepresentation

## @evidence contracts/development/implementation.md#principled-implementation

Bind applicable tiers to canonical model group digests and runtime model ids, defaulting an empty list to base near; choose the maximum supplied tier radius with base then 0.5m fallback and a 0.01m floor. Supplied estimates are not geometrically verified here, and fallback does not prove conservative enclosure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The population design declares tiers and the host measures geometry; this shared helper composes those inputs with the referenced model groups and no registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The explicit legacy radius fallback and near-tier default remain caller policy; neither a model id nor expected viewport result selects a hidden measurement.

## @evidence contracts/development/common.md#meaningful-documentation

Docs distinguish measured radii from fallback estimates, metre units, caller-selected hero filtering and per-tier model/digest references.

## @evidence contracts/development/implementation.md#efficient-algorithms

T tiers require O(T) map lookups plus canonicalization/hash cost of referenced model bytes and O(T) returned records; the argument spread still scales with admitted tier count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Formation and instance compilers share this representation owner; tier digests are recomputed because model maps and measured radii can mutate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fresh tier records and one radius transfer to the caller; no registry, measurement task or cache is retained.
