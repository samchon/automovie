# src/index.ts#IBuildPropArticulationProps

## @evidence contracts/development/design.md#principled-representation

Joins compiled prop identities to the already-built scene's node/model registries; the builder saves joint-local rests during creation, then parents joints in their authored local frames and uses native attach to preserve each resolved part's existing world placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Collects the existing scene/specification/lookup inputs for articulation lowering without creating another model or attachment service.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing placements/parts are refused rather than replaced with fixture objects; all parts use the same named-part resolution and world-preserving reparenting path.

## @evidence contracts/development/common.md#meaningful-documentation

Documents registry keys, built-scene premise, borrowed objects and the reparent/rest-restoration side effect.
