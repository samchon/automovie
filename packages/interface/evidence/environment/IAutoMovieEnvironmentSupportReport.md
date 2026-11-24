# src/environment/IAutoMovieEnvironmentSupportReport.ts#IAutoMovieEnvironmentSupportReport.IProps

## @evidence contracts/development/design.md#principled-representation

The staged set, runtime models, prop records, merged stage space, wall mounts and composed buildings with their ground heights in metres, plus a contact tolerance in metres. Each input is the existing record the report reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`createEnvironment` supplies every member from its merge; the engine function reads nothing else. The space, mounts and buildings are optional because a composed environment may have none.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Instance-set populations are excluded explicitly; the tolerance defaults to the support tolerance the building sweep uses.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member contributes and the defaults.

# src/environment/IAutoMovieEnvironmentSupportReport.ts#IAutoMovieEnvironmentSupportReport.IBuilding

## @evidence contracts/development/design.md#principled-representation

A building record and the world height in metres of its placement frame, the ground its sweep grounds bodies at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The building record does not carry its placement height, so the composer passes it beside the record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The height is the placement frame's, never inferred from geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States both members and the frame of the height.