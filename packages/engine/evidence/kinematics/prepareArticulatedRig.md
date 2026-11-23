# src/kinematics/prepareArticulatedRig.ts#prepareArticulatedRig

## @evidence contracts/development/common.md#meaningful-documentation

States the tree and rigid-transform domains, snapshot ownership, independent output and refusal of both malformed inputs and nonrepresentable composed world frames.

## @evidence contracts/development/implementation.md#principled-implementation

Parent-first FK composes parent rotation with neutral rotation and the existing basis-defined joint quaternion, and rotates the neutral translation through the parent. Breadth-first graph admission proves one connected acyclic tree before reads; the same rigid admission checks every actual composed frame before it becomes a parent or output, then normalizes its nonzero quaternion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Snapshot/admit nodes, order the tree once, then compose and admit one actual world rigid frame per bone per read using the shared quaternion, basis and local rigid-admission owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No animal name, humanoid default ROM, dummy finger mapping, stale completed pose, clamped joint or ignored scale selects an answer. Finite inputs do not excuse an overflowing composed frame; invalid arithmetic refuses without capping coordinates or replacing an invalid quaternion with identity. Unknown limits remain unknown.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation and reads are O(B+J) for B bones and J named input joints, with O(B) owned metadata/output. Parent lookup is by Map and no pairwise traversal or per-read graph reconstruction occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Graph order, admitted neutral frames, normalized axes and explicit boxes are prepared once from copied values; each read computes its actual current rotations and fresh world frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains O(B) independent scalar records for its own lifetime. Each returned Map owns fresh transforms, retains no query map and acquires no process, global cache or external handle.
