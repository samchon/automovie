# src/architecture/validateBuiltSpaces.ts#validateBuiltSpaces

## @evidence contracts/development/implementation.md#principled-implementation

Requires at least four half-spaces and finite usable computed normal lengths; this necessary plane-count floor does not prove boundedness, nonemptiness or positive volume. Rejects competing shell/cell statements and checks hierarchy cycles with the shared graph traversal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The space section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it returns the id set every later section resolves against and delegates shells and ids to their shared checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No space kind or fidelity is special-cased beyond the two named values, and a cell is not repaired or completed.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every rule for spaces, cells, planes, shells and fidelity, the hierarchy rule, the path root, and what the return value is for.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in spaces, cells, planes and shell size, plus the linear cycle walk; references resolve through the returned id set.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per building validation; its id set is reused by every later section.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-space cell id sets are released after each space; the caller owns the returned id set, bounded by the space count.
