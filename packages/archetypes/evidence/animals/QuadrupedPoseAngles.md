# src/animals/QuadrupedPoseAngles.ts#QuadrupedPoseAngles

## @evidence contracts/development/common.md#meaningful-documentation

States same-tree admission, degree/world-metre frames, complete four-chain input, independent state, preview behavior and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Visit the real parent-first tree. A direction goal shortest-arc aims the bar carried by its current parent; an orientation goal specifies its world quaternion. Inverse parent and neutral-local rotations yield the articulation quaternion, which the engine decomposes on the normalized axes before ordinary generic FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Snapshot/index graph metadata once, assemble current direction/orientation goals, lower them in admitted parent order and return fresh achieved FK frames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No species, humanoid slot, Euler sign table, copied clinical ROM, changed bar or previous-frame state supplies the rotation. Full physical endpoint closure remains the model sampler's responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation is O(B); each query is O(B+G) with fresh maps for B bones and G goals. No hierarchy preparation or mesh generation occurs per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same admitted reader, independent node metadata, normalized bases and parent order serve every preview/sample query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains O(B) independent scalar metadata and the bounded reader for the resolver lifetime; each query owns its maps/records and no input goal, completed pose or external handle is retained.
