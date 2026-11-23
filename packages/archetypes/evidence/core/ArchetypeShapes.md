# src/core/ArchetypeShapes.ts#ArchetypeShapes.of

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on scale and the ids.

## @evidence contracts/development/implementation.md#principled-implementation

Declared cells use the same local hull boundary as their visible polyhedron, under the part's current TRS. Primitives retain their original exact or explicitly bounded shape mappings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit declared cell correspondence first; otherwise use the unchanged primitive-kind switch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A replaced declared-cell geometry is refused. Arbitrary mesh/atlas parts still give no collider; no whole-shell envelope fills an opening.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in parts plus the total declared cell corners; primitive hull point counts remain fixed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computed on request for one state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns independent collider point buffers so a caller cannot mutate the source cell through its collider. Retains no request data or handle.
