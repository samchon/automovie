# src/reaction/StaggerPendulum.ts#StaggerPendulum

## @evidence contracts/development/common.md#meaningful-documentation

States the model, its state, its frame and what reads it.

## @evidence contracts/development/design.md#principled-representation

One pendulum's state with the geometry of the entry it starts from, so a recovery's steps share it rather than closing over loose variables.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The state, its spans and its readings, as `staggerStep`, `staggerClose` and `staggerRecover` read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every quantity is the body's own: its feet, its centre of mass and its pendulum's frequency.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.flat

## @evidence contracts/development/common.md#meaningful-documentation

Projects a world vector to the horizontal plane without changing x/z.

## @evidence contracts/development/implementation.md#principled-implementation

Copies x/z and sets the vertical coordinate to the floor-frame zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direct vector construction expresses the projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies no offset or tolerance to the supplied horizontal coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar work and one output vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All pendulum floor projections use this owner; no vector result is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the vector and the method retains nothing.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.reset

## @evidence contracts/development/common.md#meaningful-documentation

Restores initial feet, zero travel/time and push-scaled velocity.

## @evidence contracts/development/implementation.md#principled-implementation

Reinstates the constructor's dynamic conditions while retaining the same entry/body geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct state assignments replace the original step and phase arrays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the exact original initial values and does not retain a previous order's dynamics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant reset work independent of the previous phase count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This actual recovery's own constructor observations remain with its original prefix search. Exact outline checks independently validate every subsequent foot placement; no completed entry measurement crosses recovery calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces this search-owned instance's phase/step arrays; already issued snapshots retain their original arrays only until the prefix search ends, and footprint storage stays bounded at two records with no global result history or external handle.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.snapshot

## @evidence contracts/development/common.md#meaningful-documentation

Records the current feet, phases, steps, travel, velocity and action-local time.

## @evidence contracts/development/implementation.md#principled-implementation

Copies mutable collection wrappers while borrowing the original immutable placement/phase/vector records used by prefix continuation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record exposes exactly the state restore consumes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Contains actual current state, without a fitted replay or omitted phase.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(p+s) wrapper copying for p phases and s steps; fixed vectors and placements are borrowed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Matching foot-order prefixes share this exact snapshot under the same search's body, entry, push and speed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search owns returned snapshots until its prefix map is released; this method retains no extra snapshot history.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.restore

## @evidence contracts/development/common.md#meaningful-documentation

Restores a snapshot of this same pendulum's search context.

## @evidence contracts/development/implementation.md#principled-implementation

Restores every original state component and copies collection wrappers so extending one order cannot mutate another prefix's lists.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The assignments mirror snapshot's six state fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reinstates actual phases/steps and vectors without recomputing or altering their values.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(p+s) list copying for the restored prefix with constant fixed-state work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only prefixes from this same fixed body/entry/push/speed search supply states; foot outline reuse still checks exact placement scalars.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces this instance's current arrays and borrows immutable nested records; the search retains snapshot ownership only for its original prefix map lifetime.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.xi

## @evidence contracts/development/common.md#meaningful-documentation

Returns current relative centre plus velocity/frequency in world metres.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates Hof's unchanged xi=s+v/omega expression.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One velocity scaling and addition express the capture point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses current state and the body's original frequency without a capped lead.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant vector work and output size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared frequency but evaluates current travel/velocity afresh.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no state beyond the owning instance.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.bearing

## @evidence contracts/development/common.md#meaningful-documentation

States selected foot sides and centre-relative floor-metre output.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same placed sole sockets/outlines and original convexHull2D union after horizontal centre-relative translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exact per-foot outline readings precede one shared hull owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every selected sole point and original hull computation without a support margin or simplified shape.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(v log v) hull work for v selected sole points; unchanged placement scalars avoid rebuilding their rigid geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each outline reuse requires Object.is agreement on all seven ankle/quaternion scalars against the side's copied snapshot under this instance's fixed body and entry centre; no rounded key, support result or dynamic state is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh hull array borrowing prepared points; at most one bounded outline record per side is retained by the instance.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.captured

## @evidence contracts/development/common.md#meaningful-documentation

Defines two-foot zero-step capture at the current extrapolated centre.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original two-foot hull and pointInHull test only when it has at least three corners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One support read and containment predicate state the capture decision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original hull-size and containment thresholds without treating a near miss as capture.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(v log v) support-hull construction and O(v) containment for bounded sole point count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses only exact fixed foot geometry through bearing; the current xi is always tested anew.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no capture result or query history.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.bear

## @evidence contracts/development/common.md#meaningful-documentation

States selected support feet, duration and nearest supported pressure.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the current xi onto the original support outline and integrates the held-pressure pendulum for the requested seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Support, nearest projection and the shared advance owner retain separate responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original pressure and duration without reducing an integration phase.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded support/projection scan and one closed-form advance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the side's footprint outline and the one held-pressure propagator (`advance`); no dynamic answer is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds the original single phase to this search-owned state and retains no extra query data.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.pressure

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the three cases.

## @evidence contracts/development/implementation.md#principled-implementation

A span's pressure at its end is its shift's target or its held point; the first span's rule gives it before any span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup of the last span and one fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the recorded span; nothing is re-aimed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, or one hull and projection before any span.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The weight shift and the held spans start from this one reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a recorded or fresh vector and retains nothing.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.transfer

## @evidence contracts/development/common.md#meaningful-documentation

States measured transfer timing, the minimum-jerk pressure path, its end's fixed point with its contraction, the continuity it gives and its exact integration.

## @evidence contracts/development/implementation.md#principled-implementation

The pressure where the last span left it and the stance-foot point nearest the extrapolated centre of mass at the shift's end are the course's ends; the pendulum under a quintic pressure course has an exact closed form, linear in the end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The start, the end's fixed point, one span, the state at its end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No time step: the span's course is the exact solution of the pendulum under the stated pressure course; the fixed point is iterated until it moves less than `FIXED`, bounded by `PASSES` passes of a contraction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One phase per shift; the fixed point costs one closed-form read and one projection per pass, at a contraction under 0.3 a few tens of passes at most.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course readers evaluate the same span through the same closed form; the stance foot's outline is read once for every pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends one phase record to the search-owned phase array.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.loaded

## @evidence contracts/development/common.md#meaningful-documentation

States the point, its premise, its source and its closed form.

## @evidence contracts/development/implementation.md#principled-implementation

The fixed point of the affine map from a weight shift's target to the extrapolated centre of mass at its end, under the exact minimum-jerk shift (`staggerTransfer`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two closed-form reads give the map, one division its fixed point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact for the pendulum and shift stated; nothing is iterated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two closed-form span reads.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same shift owner as `transfer`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains nothing.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.hold

## @evidence contracts/development/common.md#meaningful-documentation

States the held point and the span.

## @evidence contracts/development/implementation.md#principled-implementation

The held-pressure propagator (`advance`) at the pressure the last span ended on, so the pressure does not jump between spans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading and one advance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The span is integrated exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `pressure` and `advance`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds one phase record to the search-owned phase array.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.advance

## @evidence contracts/development/common.md#meaningful-documentation

Advances centre-relative travel/velocity over supplied seconds and records the starting phase.

## @evidence contracts/development/implementation.md#principled-implementation

The linear inverted pendulum's closed-form propagator under a held centre of pressure: s - p grows by cosh and v by sinh of omega times the span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the span's starting state, then one state update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No time step: the span is integrated exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant closed-form work per span.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course readers evaluate the recorded span with the same propagator (`staggerPendulumCourses`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds one phase record to the search-owned phase array.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.courses

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, common clock and phase-array lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the latest span starting at or before the second, the first before every start, and evaluates the closed-form cosh/sinh/exp expressions (`staggerPendulumCourses`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One phase selector and the travel/pressure/extrapolation formulas.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no time cache; the spans are this pendulum's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

A binary search over the spans per read, valid because this pendulum appends spans at its advancing clock.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admission, the close and the displayed feet read these same spans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers retain the phase array and constants; each read returns fresh vectors and retains no time-keyed reading.

# src/reaction/StaggerPendulum.ts#StaggerPendulum.prototype.bound

## @evidence contracts/development/common.md#meaningful-documentation

Names direction, the body's heading axes and the measured forward/side/backward bounds.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the original inverse ellipse radius from normalized forward/across direction components, choosing the forward or backward semi-axis by sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One zero-direction branch precedes projection and the ellipse expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all supplied measured bounds and returns the original side bound for a nonpositive direction length.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar/vector work independent of steps or phases.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the instance's fixed heading axes while each varying direction is evaluated directly.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no query data.
