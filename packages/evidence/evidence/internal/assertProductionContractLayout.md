# src/internal/assertProductionContractLayout.ts#assertProductionContractLayout

## @evidence contracts/development/implementation.md#principled-implementation

Directory existence under the production location is the exact signal of the retired layout, because the old tree held only production-owned families; `fs.existsSync` follows the installed filesystem, and the message is built from the same layout constants the factories use.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guard owns the migration refusal, called by createEvidenceConfig and by the narrative source assertion, so neither the configuration entry nor any contract factory carries legacy knowledge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The guard refuses rather than falls back: no reference, probe or root reads the old location, and every legacy family found is reported in one error instead of the first alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two existence probes and a message linear in the found directories.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each configuration build observes the filesystem anew; caching would hide a migration made between builds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Synchronous probes leave no handle, task or retained state.

## @evidence contracts/development/common.md#meaningful-documentation

States the move, why a stale layout must fail loudly, that nothing is read from the old location, and the parameter and failure.
