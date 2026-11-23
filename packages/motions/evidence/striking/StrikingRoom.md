# src/striking/StrikingRoom.ts#StrikingRoom.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

Two bodies with their posed bones, a unit line and a positive limit in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the punch's step passes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the body and resolved bone types.

# src/striking/StrikingRoom.ts#StrikingRoom.along

## @evidence contracts/development/common.md#meaningful-documentation

States the range and the meaning of zero; the namespace states the method.

## @evidence contracts/development/implementation.md#principled-implementation

The least first-touch travel over the swept capsule points, each found by bisection of a monotone signed distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Original arm/segment/share order streams each swept point into its unchanged bisection; both actual arm axes are still read before distance queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps both original arm-axis reads before distance queries, all eighteen ordered capsule sample locations, all fourteen halvings, radii, bounds and zero-return semantics. Only unused point/radius records and later pure interpolation work after the existing zero return are omitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

A point clear over current room costs one distance query; a touching one keeps the original halving count. Streaming omits the eighteen point/radius records and temporary list, per-segment share arrays and repeated gap closures; both arm axes retain original admission, with no measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All actual point/halving queries borrow the same unchanged other-body bone map, so one operation-local collider reader shares only placed geometry, spheres and fixed shape frames; every distance is still evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collider reader lives only through this synchronous room search and ends on return or throw; only the scalar room escapes.

# src/striking/StrikingRoom.ts#StrikingRoom.ahead

## @evidence contracts/development/common.md#meaningful-documentation

States when the other person is read, the limit and the unbounded case.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the aimed person at the strike's look-back, as every striking plan does, and measures the room with {@link along}.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch and one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One room measurement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The strike's geometry calls it once per build.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingRoom.ts#StrikingRoom.behind

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, from where, the bound and the range.

## @evidence contracts/development/implementation.md#principled-implementation

Each heel's straight path back along the line is clipped against the scene's obstacles (`HumanObstacle.blocking`, with the body's breadth and stature), and the nearer block bounds the step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One path per heel, the least distance kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Other people behind are not read: the context lists no performers, only the scene's solids.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two clips, linear in the obstacles' edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanObstacle.blocking` and `HumanFoot.point`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingRoom.ts#StrikingRoom.IFeint

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

World points, a unit line, metres and a film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the punch's feint passes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.

# src/striking/StrikingRoom.ts#StrikingRoom.feint

## @evidence contracts/development/common.md#meaningful-documentation

States the share, the guard's depth, the clearance's derivation and the cases left at the declared share.

## @evidence contracts/development/implementation.md#principled-implementation

The room along the line from the launch to the guard's front, less the surfaces that would touch, over the committed path's travel along the line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guard depth and one ratio.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four bone reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The punch's geometry calls it once per build.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
