# src/architecture/designLineagePhaseSnapshot.ts#designLineagePhaseSnapshot

## @evidence contracts/development/implementation.md#principled-implementation

The reached set is the named phase plus its transitive prerequisites by breadth-first search over `requires`, and each lifecycle's role and presence are a closed truth table over whether its introducing and removing phases are null or reached; validation guarantees every phase and subject reference resolves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reached set and one map over the lifecycles behind the shared validation guard; the projection and view digest read this answer instead of recomputing presence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no phase or subject; the null phase is the completed work for every lineage, and the documentation states plainly that no compiled consumer reads this yet rather than claiming the drift it exists to prevent is prevented.

## @evidence contracts/development/common.md#meaningful-documentation

States the purpose and its unmet wiring, the null-phase meaning, the four roles, the three presences and when each applies, what counts as reached, the order, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full lineage validation, including per-lifecycle prerequisite reachability and decision-by-artifact fairness scans. Snapshot construction then costs O(P + R + S + L log L) for phases, prerequisite edges, subjects and lifecycles; its reached queue is read by index.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one phase per call from the caller's mutable record; nothing is cached across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The reached set and index live only for the call; the caller owns the returned snapshot.
