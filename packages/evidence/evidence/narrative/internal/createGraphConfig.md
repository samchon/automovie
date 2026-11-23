# src/narrative/internal/createGraphConfig.ts#createGraphConfig

## @evidence contracts/development/implementation.md#principled-implementation

The graph config directly contains the collector's complete validated claim array and leaves native diagnostic evaluation to Evidence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This small assembly step wraps the shared collector's claims in the native config shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No severity reduction or diagnostic filter is added here; empty target populations are handled by the shared collector rather than a caller-specific escape.

## @evidence contracts/development/common.md#meaningful-documentation

The prose describes claim families, empty-reference handling and retaining every diagnostic for one inspection round.

## @evidence contracts/development/implementation.md#efficient-algorithms

The collector's filesystem discovery and claim expansion dominate; this wrapper adds one constant-size config object around the resulting graph.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The collector result is used directly without a second graph rebuild; cross-call reuse is unavailable because contract discovery and props can change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned config owns the emitted graph and no handles/tasks; discovery allocations are local and no registry retains the configuration.
