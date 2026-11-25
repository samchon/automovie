# src/physics/IAutoMoviePlanPhysicalFloorSupportTargets.ts#IAutoMoviePlanPhysicalFloorSupportTargets.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines original horizontal goals, planted patches, explicit endpoint heights and one shared lowering budget.

## @evidence contracts/development/design.md#principled-representation

World-metre endpoints and floors combine with canonical profile/pattern topology; bounded pass and iteration counts constrain work.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPhysicalFloorSupportTargets shares the physical chain solver and consumes provider-owned contact geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nonplanted patches retain authored clearance; endpointHeights opt into explicit Y promises instead of replacing X/Z intent.

# src/physics/IAutoMoviePlanPhysicalFloorSupportTargets.ts#IAutoMoviePlanPhysicalFloorSupportTargets.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Separates fitted motor poses, requested goals, residual norms, signed floor errors and accumulated root drop.

## @evidence contracts/development/design.md#principled-representation

All positions and errors are metres; a negative floor error denotes penetration and rootDrop is nonnegative downward travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The floor-support planner returns new maps for later motor tracking and diagnostic inspection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Updated goal Y remains a request rather than achieved pose; infeasible endpoints and floor constraints retain their measured errors.
