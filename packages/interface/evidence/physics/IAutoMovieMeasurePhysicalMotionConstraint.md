# src/physics/IAutoMovieMeasurePhysicalMotionConstraint.ts#IAutoMovieMeasurePhysicalMotionConstraint.IAnchor

## @evidence contracts/development/common.md#meaningful-documentation

A displayed bone-origin witness, a rigid local offset, a ray extension or a blend between origins.

## @evidence contracts/development/design.md#principled-representation

The union excludes simultaneous localPoint, ray and blend; offsets and ray distance are metres, while blend weight is dimensionless in [0,1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

measurePhysicalMotionConstraint resolves witnesses from the supplied body's frame without modifying it; an omitted localPoint uses the bone origin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Motion-audit admission checks bone references and finite parameters; measurement rejects missing poses or coincident ray origins instead of inventing a witness.

# src/physics/IAutoMovieMeasurePhysicalMotionConstraint.ts#IAutoMovieMeasurePhysicalMotionConstraint.IConstraint

## @evidence contracts/development/common.md#meaningful-documentation

A time-windowed goal, distance or bend promise evaluated against displayed poses.

## @evidence contracts/development/design.md#principled-representation

kind chooses required witnesses; limits use metres for goal/distance and radians for bend, where straight is zero. The inclusive window uses film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit invokes optional enabled before measuring and target only for enabled goal samples; callbacks are synchronous, borrowed for the run and must not mutate poses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission requires a nonblank label, finite ordered window and at least one finite bound; disabled samples are skipped. Callback failures and degenerate angle geometry reject the audit.

# src/physics/IAutoMovieMeasurePhysicalMotionConstraint.ts#IAutoMovieMeasurePhysicalMotionConstraint.IRunResult

## @evidence contracts/development/common.md#meaningful-documentation

Promise of the complete finite-sample motion audit.

## @evidence contracts/development/design.md#principled-representation

samples counts all sampled instants including both endpoints; findings retains every measured bound violation, with units selected by its kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit.run allocates the result and finding records; callers may edit them after the promise resolves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid policies, missing frames, nonfinite measurements or callback failures reject instead of returning a partial passing result; no findings certifies only sampled instants.
