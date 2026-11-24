# src/physics/physicalBipedPressure.ts#physicalBipedPressure

## @evidence contracts/development/common.md#meaningful-documentation

States the controller's inputs with their IHMC sources, what the pivot and the centre of pressure set, where the trunk is served, the frame mapping and the result.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `LinearMomentumRateControlModule.computeICPController` (l.540-571) feeds `ICPController` the support polygon of the feet in contact, the capture point (the angular one off by default) and the plan; here the plan is the held point or the feet's centroid at rest (201903 `ReferenceCentroidalMomentumPivotLocationsCalculator` l.766-797, `BalanceManager` l.815-829). The floor's (x, z) as the controller's (x, y) is a reflection, under which the controller's symmetric gains and weights, its direction task and its hull-built rows stay valid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hull, one controller call and the mapping back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions; no constant is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hull of the feet's outline points and one four-variable program per update.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It runs one controller update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller keeps the controller's state.

# src/physics/physicalBipedPressure.ts#physicalBipedPressure

## @evidence contracts/development/common.md#meaningful-documentation

Documents the result.

## @evidence contracts/development/design.md#principled-representation

The controller's command as world floor points and its next state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the stance's demand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.

# src/physics/physicalBipedPressure.ts#physicalBipedPressure.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the centre of pressure, the pivot, the convergence and the state.

## @evidence contracts/development/design.md#principled-representation

World metres on the floor; the state is the controller's own type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `physicalStanceBalance.demand`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.
