# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.Reason

## @evidence contracts/development/design.md#principled-representation

The finite union names only existing trial, Newton, rate and walk refusals; it adds no acceptance state or recovery setting.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.IRejected

## @evidence contracts/development/design.md#principled-representation

A rejection pairs its real face index with either the two host coordinates or the four part/host native coordinates, in mm/radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.IData

## @evidence contracts/development/design.md#principled-representation

Actual residual/Jacobian/jet/budget values remain distinct from explicit unavailable nulls; original source jet types are reused.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.IFailure

## @evidence contracts/development/design.md#principled-representation

A terminal reason and complete available snapshot retain at most one actual rejected trial, without a recursive failure history.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.IState

## @evidence contracts/development/design.md#principled-representation

One mutable call-local collector separates its latest actual trial, terminal failure and borrowed successful meeting; dropping the call releases them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.IDirection

## @evidence contracts/development/design.md#principled-representation

Sense, accepted chart/point, attempted chord/prediction and actual solver failure are separate records; absent attempts and unavailable solver data are null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the trace observation module and consumed by the actual walk/solver/trial diagnostic path; no evaluator or solver option is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses original vector/jet types; missing measurements remain explicit and no unbounded trajectory or generic payload is admitted.

## @evidence contracts/development/common.md#meaningful-documentation

States native chart/face meaning, actual observation ownership and unavailable-data limits.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.reject

## @evidence contracts/development/implementation.md#principled-implementation

Copies only the supplied native chart and actual guard identity; does not query a domain, jet or neighbour.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The trial owner supplies the reason at its existing rejection, before the solver aggregates it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No failed trial becomes accepted and no exception is caught or replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-size chart copying and one overwritten record; no growing event list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous single rejection coordinates no requests or effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the caller's attempt retains this latest record; no module collector or source reference exists.

## @evidence contracts/development/common.md#meaningful-documentation

Names native coordinates, actual rejection ownership and unchanged null result.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.hold

## @evidence contracts/development/implementation.md#principled-implementation

Stores only actual existing residual, jets and remaining budget. The owning solver later assigns its already computed Jacobian; this operation evaluates no geometry or numeric predicate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounded record keeps terminal failure copying separate from unchanged Newton decisions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stored observation is read to choose a candidate, tolerance, budget or recovery.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant record replacement with borrowed fixed-size data; no trajectory or matrix recomputation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A current synchronous reading coordinates no requests or effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One caller-owned current record is overwritten at the next actual accepted reading and released with its attempt.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed actual data, raw residual meaning and null Jacobian before the solver computes it.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.fail

## @evidence contracts/development/implementation.md#principled-implementation

Copies only supplied chart, residual, matrix and already read jet vectors; no mathematical quantity, query or failure classification is recomputed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner supplies the same bounded snapshot rule to solver and trial callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Null fields retain unavailable observations and the returned null cannot recover or change the rejected result. No callback or exception handler is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant bounded copies of at most two six-vector jets and one four-by-four matrix; no trajectory scan or growing collection.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One synchronous terminal observation coordinates no requests or effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the supplied call-owned state retains one detached failure, overwritten by a later terminal failure; no module state persists.

## @evidence contracts/development/common.md#meaningful-documentation

Records original chart units, absent fields, borrowed input versus detached output and unchanged null result.

# src/geometry/construction/AutoMovieSolidTraceObservation.ts#AutoMovieSolidTraceObservation.format

## @evidence contracts/development/implementation.md#principled-implementation

Serializes only terminal direction snapshots. Nonfinite stored numbers become explicit strings instead of JSON null masquerading as finite data.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One suffix preserves the original readable diagnostic prefix and carries structured observation data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not run a solver, query a surface, replace a geometry result or suppress an error.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work and output are linear in the supplied bounded terminal snapshots, at most two from the arc walk.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure serialization coordinates no requests or effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one string and retains neither the snapshots nor any source afterward.

## @evidence contracts/development/common.md#meaningful-documentation

States preserved prefix, normalized data scope and explicit nonfinite representation.
