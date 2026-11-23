# src/physics/planPhysicalFloorSupportTargets.ts#planPhysicalFloorSupportTargets

## @evidence contracts/development/common.md#meaningful-documentation

States how support plans use actual geometry, authored goals and the shared root-drop budget.

## @evidence contracts/development/implementation.md#principled-implementation

Validates floor-fit controls and passes planted state with the original endpoint height so a patch without witnesses retains actual floor error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses the support planner for root and reach, then the floor-chain solver for each declared limb.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Measures the patch from its declared colliders and retains the fitted endpoint and floor residuals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Applies the existing pass and iteration budgets and shares a limb's planted status across its floor constraints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Fits one plan from the current arguments with invocation-local state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows profile geometry and returns only its plan, with no retained resources.
