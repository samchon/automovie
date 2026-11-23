# src/physics/IAutoMovieMotionAudit.ts#IAutoMovieMotionAudit.IBody

## @evidence contracts/development/common.md#meaningful-documentation

One body acceptance policy paired with exactly one collision and joint description.

## @evidence contracts/development/design.md#principled-representation

The union requires either a physical profile or geometry-only description and excludes supplying both.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit reads the selected description through motionAuditGeometry; frame body identity comes from the inherited policy id.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalMotionAudit validates the selected representation before sampling; neither branch makes the audited poses a simulation result.

# src/physics/IAutoMovieMotionAudit.ts#IAutoMovieMotionAudit.IPolicy

## @evidence contracts/development/common.md#meaningful-documentation

Independent speed, support, penetration and joint acceptance limits for one observed body.

## @evidence contracts/development/design.md#principled-representation

Speed limits are m/s, angular limits radians and geometric tolerances metres; support windows use inclusive film seconds and world bone-origin points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit reads these limits independently of the observed frame; absent speed entries are unbounded and absent constraints add no extra checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission requires finite nonnegative tolerances and valid body-local references. Compression allowance is opt-in; inter-body overlap uses the smaller of the two policies' tolerances.

# src/physics/IAutoMovieMotionAudit.ts#IAutoMovieMotionAudit.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

A sampled measurement outside its independently supplied motion acceptance bound.

## @evidence contracts/development/design.md#principled-representation

kind selects actual and limit units: m/s for speed, radians for angle or joint, metres for all other kinds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit allocates findings in sample traversal order and labels the responsible segment, joint, constraint or inter-body pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every violation is retained; the record contains a measured value and the failed bound rather than a corrected pose or a continuous-time guarantee.

# src/physics/IAutoMovieMotionAudit.ts#IAutoMovieMotionAudit.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A finite-time motion audit driven by the same pose sampler used by its consumer.

## @evidence contracts/development/design.md#principled-representation

start and end are finite film seconds with end >= start; rate is positive finite samples/s and floor is finite world Y in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMotionAudit retains the preceding frame for speed differences during the run. sample and allowed are synchronous callbacks whose exceptions reject the promise.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission validates policies and sampled frame completeness; callers keep returned frames stable through the next sample. Empty bodies are permitted and do not establish scene coverage.
