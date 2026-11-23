# src/scene/buildSoftBodyObject.ts#buildSoftBodyObject

## @evidence contracts/development/implementation.md#principled-implementation

Copies canonical Engine surface data through unchanged Float32/SDK index projection and Engine bounds, preserves required status/default DoubleSide values, reuses compatible live buffers and transfers changed representation to a completed owned geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Small local fill/bounds/disposal helpers keep canonical projection distinct from solve and material ownership; one current retirement plus optional failed predecessor expresses the narrow geometry lifecycle without a manager.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No viewer-authored cloth geometry or solve status is invented; valid surface data and exclusive mutable projection ownership are premises. CPU state/event completion does not prove actual GPU upload, native same-frame behavior, visible cloth or physical validity.

## @evidence contracts/development/common.md#meaningful-documentation

Documents canonical fields, Float32 precision, drawn-panel bounds/null visibility, required status, borrowed/default material, terminal failures and existing maintained unit consumers without inventing a production route.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertex components and I indices, updates copy O(V+I); compatible vertex arrays/wrappers are reused, SDK setIndex owns width selection through one undrawn staging geometry and changed representation rebuilds only its actual buffers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuse requires identical Float32 component lengths and index constructor/count; different surface values still overwrite the live arrays and source status, while changed shape/width acquires a new geometry rather than losing prior native attributes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Acquired geometry/default material roll back independently on construction failure; changed geometry retires its predecessor once, a failed predecessor/cause is retained with further updates refused, and final close attempts current/default owners independently. Public retirement remains unverified native/kernel settlement.
