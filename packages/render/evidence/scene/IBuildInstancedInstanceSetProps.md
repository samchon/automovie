# src/index.ts#IBuildInstancedInstanceSetProps

## @evidence contracts/development/design.md#principled-representation

Supplies compiled compact placements/LOD and model-id registries; sources must describe rigid single-material representations because flattening rejects skin/morph/multi-material input rather than silently changing their deformation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps optional loaded prototypes beside portable models so the builder can borrow a loaded object or construct a missing representation without a second scene registry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing prototype entries use the declared model, not fixture-specific fallbacks; referenced missing models and unsupported representations are refused by the builder.

## @evidence contracts/development/common.md#meaningful-documentation

Documents source ownership, model/prototype lookup keys, portable-model fallback and the supported rigid representation boundary.
