# src/posture/HumanLimbPair.ts#HumanLimbPair.Assessment

## @evidence contracts/development/common.md#meaningful-documentation

Defines the observed posture, the lifetime of the observer and the analytic-only trial behavior.

## @evidence contracts/development/design.md#principled-representation

The callback observes the existing native evaluation, which carries the fit's geometric residuals in their original units. The flag selects whether the general optimiser can run.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The paired fitter owns this request. The caller needs one native residual report and one search policy to compare its posture trials.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both search modes report the actual evaluation through the same typed callback. The mode does not mark a failed candidate as accepted.

# src/posture/HumanLimbPair.ts#HumanLimbPair.Assessment.inspect

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the evaluation passed to the receiver and its request lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The fitter supplies the evaluation from the accepted direct or adjusted pair, the returned direct trial, or the general optimiser's result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One callback receives the already available evaluation on the selected return branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No residual is synthesized or replaced by a convenience success value.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fitter passes the current evaluation without another model evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same reading serves native branch admission and the caller's trial comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fitter holds the callback only for the current request and does not attach it to the returned fit.

# src/posture/HumanLimbPair.ts#HumanLimbPair.fitted

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Independent fits where the arms keep clear or both are placed at a prescribed course whose swivels the coupled solve left; a coupled still solve where they meet otherwise, on the pair's canonical representative under the mirror.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two fits, one clearance reading per arm, then one coupled solve when they meet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither arm is fitted against the other's fit; the representative is chosen from the inputs alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two directly solved arm fits, followed by the existing coupled optimizer only on actual overlap. Source attachment FK stays lazy, and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the existing fit, clearance and trajectory owners. A supplied person/refit reader crosses only these synchronous calls; actual mirror/root-frame poses and changed arm descendants still invalidate scalar dependencies, and near/target/result choices remain unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Pair-local source FK and temporary callbacks end with this call. A borrowed reader remains with its synchronous parent, or a lazily created standalone reader ends here; no returned pose, seed, value or retained optimizer context captures the reader or supplier.

# src/posture/HumanLimbPair.ts#HumanLimbPair.IFitted

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its content.

## @evidence contracts/development/design.md#principled-representation

The pose and one seed per arm, null where the fit has none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pose, per-arm seeds and per-arm fit values are the existing data the refit caller consumes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IAutoMovieSwivelSeed`.
