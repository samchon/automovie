# src/actions/walkLegBinding.ts#walkLegBinding.prepareRelative

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed placements, local frames, varying probes and the pair-reading lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid transform b⁻¹·a: the target's inverse rotation applied to the position difference, and the inverse times the source rotation applied to each probe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pair preparation owns the relative translation and rotation; the reader only carries each probe.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No probe, frame or quaternion convention changes; a changed placement needs another reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation takes the inversion, the quaternion product and the offset rotation out of each of the pair's probes; each probe costs one rotation and one addition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A reading holds one placed pair through its probe loop, so only the pair's frame arithmetic is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure holds one translation and one rotation until its loop finishes; it retains no probe or result.

# src/actions/walkLegBinding.ts#walkLegBinding.prepareInside

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed shape, segment-local points, the floor and the zero-outside depth.

## @evidence contracts/development/implementation.md#principled-implementation

A hull query rejects points outside the sphere about its vertices, then takes the least face-plane depth in the hull's frame; other shapes take physicalShapeSegmentDistance at the point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shape-kind selection and the hull frame's preparation precede one point reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The floor only stops the face scan once the depth can no longer exceed it, so a depth the caller keeps is always the hull's least face depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares a hull's inverse rotation and faces once per shape, then scans faces in order per point; non-hull cost is the engine's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A reading holds the same placed shapes across all its probes, so each shape's frame and faces are shared; changed geometry needs another reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader per visited shape holds its frame and faces and releases with the reading.
