# src/coupled/edgeRescueScene.ts#edgeRescueScene.IScene

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The lip's point and axes, the instants and the grip's path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the role planners read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by prepare.

# src/coupled/edgeRescueScene.ts#edgeRescueScene.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The fall to the grip is free (`sqrt(2 d / g)`); the pull's capstan reduction and the rescuer's friction bound decide the load; the margin is the prone centre of mass behind the shoulder less the reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the edge, admit the bodies, then the timeline and the grip path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each refusal names its load or margin; the constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan, identically for both roles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains its closed-form constants.

# src/coupled/edgeRescueScene.ts#edgeRescueScene.proneShoulder

## @evidence contracts/development/common.md#meaningful-documentation

States the height and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The lying law's prone pose resolved at the origin: its shoulder joints' mean height over its lowest collider surface.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose, two reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body's own prone pose, no typed chest depth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two resolves per scene.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The scene keeps the height.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
