# src/environments/buildings/buildingDoor.ts#buildingDoor

## @evidence contracts/development/implementation.md#principled-implementation

Recursively carried door parts are selected by authored affordance relationships; subtracting the hinge pivot gives the rigid leaf pose expected by portal geometry and staged object clips.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ordinary door producer owns sizes and range. This adapter owns only division and re-expression around the root of the moving node.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A chord greater than 180 degrees cannot retain its authored direction through ordinary shortest-arc quaternion samples, so such a timed swing is refused. The leaf model is kinematic and makes no aggregate mass claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Operates on one door's bounded part and contact population, and constructs at most two keys.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reusable plan makes one distinct interactive node per occurrence; this adapter never shares a live model identifier across placements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The output holds two finite model records and the optional caller-owned rotation clip. The part filter and source door are released after preparation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines what stays static, the source of aperture dimensions, the hinge frame and the shot clock.
