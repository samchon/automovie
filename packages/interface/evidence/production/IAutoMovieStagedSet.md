# src/production/IAutoMovieStagedSet.ts#IAutoMovieStagedSet

## @evidence contracts/development/design.md#principled-representation

A discriminated union on the literal `success`; `stageScene` collects every violation in one pass and composes a scene only when none was found, so a caller cannot reach a scene that some check rejected.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two variants with only what each outcome needs; mounts are a sibling list rather than a scene field because their transform depends on the parent's pose, which only the performance stage resolves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Staging converts placements without judging dramatic geometry and never repairs an invalid placement, so the success variant is the authored stage lowered as written.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, why mounts sit beside the scene, who bakes them and what the host still does, and what each variant means.

# src/production/IAutoMovieStagedSet.ts#IAutoMovieStagedSet.ISuccess

## @evidence contracts/development/design.md#principled-representation

Returned only when every placement, camera aim, light, space and fog check passed, with each actor's `facingDeg` turned into a rotation about `+Y` and each camera's `lookAt` into the shortest-arc rotation that aims its `-Z` at the point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Blocking and performance read this scene record. Mounts and actor support timelines sit beside the rendered scene because they belong to the staged performance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mount bindings are carried as authored, and a mount's rig and bone preconditions are left to the performance stage, the first place with skeleton access, rather than assumed here.

## @evidence contracts/development/common.md#meaningful-documentation

States what success guarantees, what the scene holds, and how mounts and scoped ground relate to staged actors.

# src/production/IAutoMovieStagedSet.ts#IAutoMovieStagedSet.IFailure

## @evidence contracts/development/design.md#principled-representation

Every finding of the single `stageScene` pass is collected through one `ViolationCollector` with its JSON path, expectation and value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the list, because no partial scene is safe to block or perform against.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No contradiction is auto-corrected, so the author fixes the stage instead of the engine moving or dropping a placement.

## @evidence contracts/development/common.md#meaningful-documentation

States that failure composes nothing and that the list is complete for the correction round.

# src/production/IAutoMovieStagedSet.ts#IAutoMovieStagedSet.IMount

## @evidence contracts/development/design.md#principled-representation `stageScene` emits one only for an actor with `attach`, after refusing a rider mounted on itself or on a parent that is not a placed actor; `coupleObjects` then refuses a rig-less parent or an absent bone before baking.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The rider id and the binding, which is everything `compileAttach` needs besides the parent's posed skeleton that performance supplies; the same record carries the coupling into `IResolveBeatProps.mounts` for the next beat.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A mount emits no grab, attach, detach or release events, because it is standing scene state rather than a per-shot pickup, and no rider is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States who bakes it, what the host does, the override rule, and per field the rider and the binding's source.
