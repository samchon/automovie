# src/skeleton/IAutoMovieBone.ts#IAutoMovieBone

## @evidence contracts/development/design.md#principled-representation

Bone identity, resolved parent and local rest translation/rotation establish the FK graph; resolvePose and lowerSkeletonNodes do not apply authored rest scale. Nullable rig ROM override selects the shared humanoid default when available, while an explicit override replaces it; declared axes likewise take precedence over the host's per-bone table in every engine resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record keeps neutral geometry, pose admission and articulation axes local to the bone without embedding clinical defaults or animation channels.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null bone constraint is default-or-unconstrained, distinct from a null axis inside a supplied constraint, and a named parent must exist in the admitted single-root connected graph.

## @evidence contracts/development/common.md#meaningful-documentation

Defines unique semantic identity, parent/rest basis, default-versus-override ROM behavior and the axes fallback order.
