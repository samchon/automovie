# src/geometry/separateAutoMovieMeshSequence.ts#separateAutoMovieMeshSequence

## @evidence contracts/development/implementation.md#principled-implementation

Each projected-overlap minimum defines a difference constraint between an earlier and later mesh; the forward longest-path pass satisfies this acyclic graph, and subtracting half the last travel preserves every relative displacement while balancing the endpoints. Axis-parallel faces remain outside the directional clearance contract.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared triangleIndicesOf admits connectivity and measureAutoMovieMeshClearance owns projection and clipping; this function owns only axial intervals, ordered constraints and rigid buffer copies, avoiding a second projected-triangle implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The interval shortcut skips only pairs already proved clear under nondecreasing travel; no projected area is evaluated for those pairs, and malformed singleton meshes are still refused before the shortcut.

## @evidence contracts/development/common.md#meaningful-documentation

Describes metres, caller-defined order, balanced translations, fresh output ownership, the axis-parallel limitation and the malformed-input and overflow refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

For M meshes and V total coordinates, interval admission and copies cost O(V), the ordered graph considers O(M squared) pairs, and only pairs without an axial separation proof invoke the indexed projected-clearance measure; travel and interval tables use O(M) space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A call places one current sequence; no results survive coordinate changes, and each earlier/later pair is measured at most once within the call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Interval and travel arrays are call-local and bounded by the mesh count; structuredClone transfers fresh attribute buffers to each returned mesh, with no retained cache or running resource.
