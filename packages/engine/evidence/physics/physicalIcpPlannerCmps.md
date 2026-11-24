# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

Documents the side, the sole frame and the support polygon in that frame, with units.

## @evidence contracts/development/design.md#principled-representation

The reference's per-side sole frame and foot support polygon (`supportFootPolygonsInSoleZUpFrame`, a footstep's predicted contact points or default polygon), in the right-handed z-up sole frame `physicalPlanarPolygon.IFrame` defines, metres. The side is a closed union; an empty polygon remains a runtime condition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the pivot functions and passed through the planner's builders by their callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.IParameters

## @evidence contracts/development/common.md#meaningful-documentation

Documents every pivot parameter with units and sign conventions.

## @evidence contracts/development/design.md#principled-representation

The calculator's parameters (`initializeParameters` l.200-238, `percentageChickenSupport` l.186-187) for the two-pivot mode; `physicalIcpPlanner.DEFAULTS` gives their values and sources.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extended by `physicalIcpPlanner.IParameters` and read by the pivot functions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.entry

## @evidence contracts/development/common.md#meaningful-documentation

States the entry pivot's construction with no previous foot and its source lines.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `computeEntryCMPForSupportFoot` and `computeEntryCMP` in two-pivot mode (l.546-610) with no previous centroid or exit pivot, as `computeSupportFootReferenceCMPsDuringSingleSupport` calls it when no transfer preceded (l.413-414), through `constrainCMPAccordingToSupportPolygonAndUserOffsets` (l.743-760). The step share uses the calculator's one factor, which it reads from the exit pivot (l.217).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the shared file-private `constrain`, as the reference shares its constrain method.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hull and shrink of the foot polygon, linear-logarithmic in its vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.exit

## @evidence contracts/development/common.md#meaningful-documentation

States the exit pivot's construction, the point-foot case and why the toe branches never apply.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `computeExitCMPForSupportFoot` and `computeExitCMP` (l.612-627, l.658-718) for the last step of the plan, whose toe placements require a later step (l.671).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The point-foot case, then the shared `constrain`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear-logarithmic in the foot's vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.centroid

## @evidence contracts/development/common.md#meaningful-documentation

States the foot centroid on the floor.

## @evidence contracts/development/implementation.md#principled-implementation

`computeFootstepCentroid` (l.505-511): the area centroid of the foot's hull, Euclid's `getCentroid`, carried to the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear-logarithmic in the foot's vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpPlannerCmps.ts#physicalIcpPlannerCmps.between

## @evidence contracts/development/common.md#meaningful-documentation

States the chicken rule between the feet's centroids and their joint centroid.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `computeFinalCMPBetweenSupportFeet` (l.766-797). The joint hull is built in the first sole's frame rather than the world; a rigid transform preserves the hull and its area centroid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two centroids, the joint centroid, then the reference's two-piece interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None. No casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear-logarithmic in both feet's vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
