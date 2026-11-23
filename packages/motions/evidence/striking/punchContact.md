# src/striking/punchContact.ts#punchContact.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

World points and unit directions in metres, angles in degrees, the tracker and the arm's solution as their owners' types.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the punch's footwork, stroke and record read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the tracker, reach solution and resolved bone types.

# src/striking/punchContact.ts#punchContact.IContact.corrected

## @evidence contracts/development/common.md#meaningful-documentation

States the argument and what each returned correction carries.

## @evidence contracts/development/implementation.md#principled-implementation

solve's producer accumulates the tracker's actual ordered displacement units onto its planned goal, solves each newly arrived reach with the original launch advance, then returns adjacent reach differences on those units' original start/duration clocks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered tracker-unit loop fills missing per-arrival reaches and emits fresh advance/end/hint/reach/moved records; punchGeometry consumes those same corrections for wrist, trunk step and arm reference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original reach band, launch stepping decision, room bound, strict punchReach.same predicate and tracker clocks; no correction, physical target or authored limit is fabricated or relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

A query pays the actual tracker-unit read and O(K) fresh correction/vector work for K arrived units. Only previously unseen arrivals pay their original analytic reach and any first lazy room scan; source geometry costs remain with solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The producer's fixed launch plan and stable ordered tracker arrivals justify one retained reach per arrival index; each query still reads current units and forms fresh differences. Another geometry/plan gets independent state, with no new pose/time cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The solve-owned closure retains its context, tracker, entry map, lazy room and launch plus at most one reach per tracker correction; that population follows the original tracker's action window and is released with the geometry. Returned arrays/records are fresh and retain no FK workspace.

# src/striking/punchContact.ts#punchContact.solve

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, result and the body's unchanged-skeleton topology premise; the namespace states the contact method.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist goal is the tracked fist point less the hand-rotated socket, the step-in closes the line to the band's mid reach, and the two-segment reach solves the arm within the technique's flexion band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The aim, the turned and lowered shoulder, the fist, the tracking, then the step-in and the arm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrist no place on the line brings within the band is not stepped toward; a feint does not step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Trunk/entry FK and clamp metadata remain O(B+J), plus actual joint/digit work; each canonical Map removes B entry tuples and their array. After the tracker-unit query, K arrived units form K fresh corrections, with bounded reach work only for new arrivals and the existing lazy room scan. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the body's topology for its unchanged skeleton while resolving current transforms afresh. The fixed tangent target keeps one lazily resolved participant, local frame and actual bone-name demand, yet every seconds query reads fresh bone frames and only its world point. Each arrival's reach remains indexed by the tracker's original correction order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned correction closure holds its context, tracker, entry bone map, room result, optional fixed tangent-target participant/frame/name set, one launch reach and at most one reach per tracker correction; this operation-local state is released with the geometry, without a global cache or resource handle.
