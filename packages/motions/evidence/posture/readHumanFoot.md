# src/posture/readHumanFoot.ts#readHumanFoot

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged body/displayed-bone binding, side/default ordering, borrowed socket ownership and synchronous lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Places sockets with HumanFoot.sockets and outline points with the surface owner's exact point expression, then retains the original minimum-height and inclusive HumanFoot.BEARING predicate for the requested foot base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two side-indexed maps share socket and outline placements across the base and heel readers; HumanFoot retains sole geometry and raw public entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derives every shared point from the bound body/bone map, accepts no caller-supplied derived sockets, and uses the physical outline when present, falling back to landmarks only on feet without an outline.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each requested side's three socket and outline points are placed at most once per operation, omitting unread normal/forward rotations and frame wrappers; every base read still performs the original linear minimum and bearing filter over that side's actual points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller binds one unchanged body and displayed bone map for this synchronous evaluation; changing either requires a new reading, without pose identity/time keys or cross-evaluation sharing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reading retains at most two socket arrays and two outline-point arrays until its synchronous owner returns or throws; outputs may retain their resulting points, while no global/body/plan cache retains the reading.
