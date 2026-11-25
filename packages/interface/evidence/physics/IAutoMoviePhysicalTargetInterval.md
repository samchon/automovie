# src/physics/IAutoMoviePhysicalTargetInterval.ts#IAutoMoviePhysicalTargetInterval.IPlan

## @evidence contracts/development/design.md#principled-representation

Start and endpoint world poses share one causal interval, including a shortened remainder after policy revision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Clock identity and pose records are sufficient for checkpoint continuation; compiled samplers remain outside this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plan carries requested poses rather than measured body state; caller admission owns bone completeness and valid nonzero duration.

## @evidence contracts/development/common.md#meaningful-documentation

The endpoint is step/rate in local seconds; from and targets may retain borrowed records and are not deep snapshots.

# src/physics/IAutoMoviePhysicalTargetInterval.ts#IAutoMoviePhysicalTargetInterval.IPlanInput

## @evidence contracts/development/common.md#meaningful-documentation

Explains same-step revision, prior-step continuity and fallback to initial poses.

## @evidence contracts/development/design.md#principled-representation

step/rate gives cache end seconds; nativeRate locates the completed integer tick, while all poses remain world rigid transforms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalTargetInterval.plan retains initial/endpoint pose records and reuses the previous fitted plan's completed prefix.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Clock validity and bone completeness remain caller premises; a noncontiguous prior plan does not invent a completed reference.
