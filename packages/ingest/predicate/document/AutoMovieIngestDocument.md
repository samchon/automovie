# src/document/AutoMovieIngestDocument.ts#AutoMovieIngestDocument.ingestDocument

## @evidence contracts/development/common.md#meaningful-documentation

The method states the parsed-document premise, kept local transforms and track clocks, normalized accessor handling, ownership and animation refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

The mapper assigns IDs from node and animation order and indexes parent links plus joint membership. It reads each node's local TRS into a new record. Channel paths choose their component count and the sampler chooses its interpolation. The key-time and output-count checks ensure each channel has the expected value arity and tangent triple when cubic.

## @evidence contracts/development/implementation.md#efficient-algorithms

The mapper indexes nodes, links, mesh/camera/skin resources and joints once for this conversion. Channel traversal decodes the applicable accessors into owned arrays. Work follows graph entries and decoded track data. The indexes and glTF document are released from the call when it returns or throws.

# src/document/AutoMovieIngestDocument.ts#AutoMovieIngestDocument.humanoidSkeleton

## @evidence contracts/development/common.md#meaningful-documentation

The method describes first slot ownership across skins, relative rest and root behavior, the finite unit-quaternion premise, TRS shear limit, default ID, missing hips result and ancestor-cycle refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The mapper normalizes supported joint names and claims the first node for each mapped slot. It finds each mapped bone's nearest mapped ancestor and composes skipped helpers into the child's rest in that frame. It keeps a root's local TRS and checks for repetition during each ancestor walk.

## @evidence contracts/development/implementation.md#efficient-algorithms

The mapper prepares a slot map and parent index once. Work follows nodes, skin joints and the sum of inspected ancestor paths, bounded by the mapped slots and node count. Each walk retains only its own visited nodes and helper list. The result owns its bone records.
