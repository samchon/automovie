# src/affordance/operateState.ts#operateState.at

## @evidence contracts/development/common.md#meaningful-documentation

Defines original mechanism/start place/optional hinge, dimensionless progress and returned world-metre point, outward normal and degree roll; the namespace distinguishes rigid from articulated props.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the same rigid mechanism owner used by actual operation plans: axial button/slider/insertion travel, knob roll or rigid hinge orbit with the original pull sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cold facade prepares and evaluates the one selected branch rather than copying a second set of state equations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original mechanism amounts, defaults, normal normalization, hinge/foot/axis policy and unmodified progress are preserved without clipping, sampling or acceptance changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size branch preparation/evaluation takes O(1) work and fresh required outputs. Actual fixed plans retain prepare to omit repeated geometry preparation; this facade retains no producer between calls.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold and prepared readers share one numerical owner. Each cold call reads its supplied current fixed geometry independently, with no result replay or identity-based equivalence assumption.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local reader and scratch release at return or throw; returned point/normal preserve their original fresh-or-borrowed branch ownership and no caller geometry, time history or external handle is retained by this facade.

# src/affordance/operateState.ts#operateState.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed inputs, world frames and the varying dimensionless progress.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the mechanism's original translation or axis-angle rotation; the normalized normal, hinge foot, arm and pull sign depend only on its initial geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mechanism branch chooses the progress reader and prepares only that branch's fixed geometry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every progress uses the original travel, rotation and normal equations with no clipping, sampling or tolerance change.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation serves P actual progress reads without repeated normal normalization, hinge-foot/sign construction or fixed hinge-axis length calculation. Axis prerequisites remain lazy until the original first angle; every read retains its actual angle trigonometry/point/normal transform in O(1).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plan owns one unchanged mechanism, initial place and hinge; only their geometry is shared, while each progress computes its own state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader retains constant-size geometry until its operation plan is released; no history of progress or state results is stored.
