# src/striking/KickCarriage.ts#KickCarriage.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Members define canonical body, entry/feet, side/line, timing and metre/angle parameters for the actual carriage.

## @evidence contracts/development/design.md#principled-representation

Existing authored posture, foot placements, local clocks and measured scalar geometry define the carriage without numerical solver state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read by posture's root/support-foot/turn/tilt/lowering geometry; candidate goals and fit results stay with the contact planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Inputs contain actual physical parameters rather than pre-resolved pose flags, baked endpoints or scene-specific identifiers.

# src/striking/KickCarriage.ts#KickCarriage.posture

## @evidence contracts/development/common.md#meaningful-documentation

States local support/turn clocks, actual carriage, planted support and current-body metadata lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the original minimum-jerk pelvis/support step, support-foot pivot, support-hip-preserving lean and two-leg lowering geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Root/support-foot geometry feeds flat pose, optional tilt and unchanged lower owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All original coefficients, authored joints, body motion, foot plants/MTP offsets and raw lowering operations remain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Original kinematic and native hip work remains; a caller's genuine current ROM mapper avoids repeated index setup across the two actual tilt hip reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only exact FK prerequisites and genuine same-body unchanged-table metadata are borrowed; each flat/tilted pose still runs every original native joint projection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The current reader/projector and temporary frames end on return or throw; the fresh posture stores no supplier, map, projector or history.

# src/striking/KickCarriage.ts#KickCarriage.hip

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual body/posture/side, ignored limb goals, world-metre output and synchronous metadata scope.

## @evidence contracts/development/implementation.md#principled-implementation

The canonical trunk owner assembles/clamps all authored joints and digits before actual requested hip FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One demanded trunk read returns the actual upper-leg origin.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No native projection, authored joint or actual hip computation is skipped; a projector remains a checked metadata loan.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed hip-name demand limits only output ancestry; a same-operation projector shares index setup while all original admission/projection remains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Search/course callers explicitly fix body and ROM tables within their synchronous operation, while every changed posture/hip is evaluated normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No pose/map/reader/projector is retained here; only the actual fresh hip vector escapes its temporary trunk map.
