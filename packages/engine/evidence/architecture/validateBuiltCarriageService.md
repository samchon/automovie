# src/architecture/validateBuiltCarriageService.ts#validateBuiltCarriageService

## @evidence contracts/development/implementation.md#principled-implementation

Stages the work with `builtEnvironmentWorldMatrices`, choosing the claiming state for this run and the current state for every other member, reads the carriage element's world origin from the translation column, and decides membership with the engine's own space containment query.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One staged check separated from `validateBuiltEnvironment`; staging and containment come from their shared owners instead of the private staging copy the validator kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No connector or space is special-cased. The skip means no descendant states a volume; it does not mean a finite-bounds test failed.

## @evidence contracts/development/common.md#meaningful-documentation

States service containment, current/selected-state staging, the skip only when no descendant volume is stated, and the finding path; an unbounded stated cell is not silently skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each non-null service claim builds/scans a space subtree to decide whether volume is stated. Each state with retained claims pays full `builtEnvironmentWorldMatrices` staging, followed by a full subtree containment query per claim, including its delegated volume checks. Connector carriage indexes are built once; cost is not only linear element staging.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one carriage index across a connector's states and one matrix map across a state's claims. Distinct claiming states stage separately because their displacement differs; nothing is cached across validation calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each staging is released before the next state; one violation per refused claim is appended to the caller's collector.
