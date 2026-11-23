# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.IStance

## @evidence contracts/development/common.md#meaningful-documentation

Defines the state at landing, signed stance travel and duty fraction.

## @evidence contracts/development/design.md#principled-representation

The course owns the rigid landing frame and signed metres. The gait owns the stride fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ride uses duty to distinguish stance/swing and this owner reads the geometry and signed travel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It stores no current body frame or previous sample.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.ICross

## @evidence contracts/development/common.md#meaningful-documentation

States the side and the metres.

## @evidence contracts/development/design.md#principled-representation

A body-frame lateral direction, +1 toward the body's left (+x) or -1 toward its right, and a nonnegative distance in metres; it applies to the hooves on the other side of the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `EquineLateral.crossing` and read by `footprint`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.Crossing

## @evidence contracts/development/common.md#meaningful-documentation

Film seconds, metres and whether the stance is a fore's; undefined outside a two-track figure.

## @evidence contracts/development/design.md#principled-representation

A pure reader over the admitted figures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `EquineLateral.crossing`, called by `stances`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.stances

## @evidence contracts/development/common.md#meaningful-documentation

Connects touchdown phase and hoof duty to the route's signed stance advance.

## @evidence contracts/development/implementation.md#principled-implementation

Read native body states at touchdown and separately at release; a stance after the course's end, such as the next footfall of a timed path that ends at speed, follows the course's final velocity (`onward`), and a two-track figure's crossover from the optional `crossing` reader over the same seconds and travel. A rein-back keeps at least one diagonal down.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reusable query combines phase-to-time, course distance and this gait's fore or hind duty.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Forward motion and signed reverse progress read the same route instead of synthesizing stance travel from speed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two existing course reads and one gait timing read per queried stance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing route and resolved gait supply all geometry and timing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the tiered course and clock readers stay with the returned sampler until the ride is released.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.onward

## @evidence contracts/development/common.md#meaningful-documentation

States the continuation.

## @evidence contracts/development/implementation.md#principled-implementation

Within the course its own state; after it, the final state advanced along its heading by its speed times the overrun.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound check, one advance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course itself is never edited.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work over one plan read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one state.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.elevation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the points and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The cannon runs from the fetlock (chain point 3) to the carpus or hock (chain point 2); the coordinate interpolates their heights, less the hoof endpoint's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The heights are the rig's; no withers share stands in.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.footprint

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and that terrain is applied afterwards.

## @evidence contracts/development/implementation.md#principled-implementation

Centre the hoof on its stance: half the signed travel ahead of its neutral point at landing, or, when the body heading departs from the travel heading, midway between its neutral points at landing and at release, so the hoof sits under the same body point at both ends. That body point is the neutral hoof moved toward the limb's attachment by at most half the stance's travel: a long stance is centred under the attachment, where the rigid limb's reach is greatest, and every stance still passes through the neutral footprint, so a standing hoof stays at its neutral place. A crossing leg of a two-track figure centres on its neutral point shifted sideways by the stance's `across`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rigid point or the mean of two.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; both forms read the stance's own placements.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFrame.point`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.departure

## @evidence contracts/development/common.md#meaningful-documentation

Names the course frame and admission rule without taking ownership of route math.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluate the native course at its distance-zero time so delayed starts retain the right world placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An absent request exits immediately. One initial state admits the explicit request or reports its conflict.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A moving start never silently reinterprets as a standing start or moves the route mark.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one existing course point only for requested departure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The route owns the initial time and placement through existing queries.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the requested state escapes. No viewer or external handle exists.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.step

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes provisional earlier stance from a hooved neutral standing departure.

## @evidence contracts/development/implementation.md#principled-implementation

Replace a pre-start stance anchor by the real start footprint with no prior advance and begin that hoof swing no earlier than phase zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Select the start anchor and lift boundary, then evaluate the existing clearance and interpolation law on the normalized interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Do not move the anchored hoof by authoring a virtual step before the course.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and storage over one stance, with no temporal search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The existing step law owns minimum jerk and the admitted stance owns ordinary phase/travel.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No sample or handle is retained.

# src/animals/QuadrupedHoofTrack.ts#QuadrupedHoofTrack.target

## @evidence contracts/development/common.md#meaningful-documentation

Defines frames, units and the optional next stance.

## @evidence contracts/development/implementation.md#principled-implementation

Straight signed progress gives the same distance from the half-stance-centred landing in a common basis. World-space points and frames anchor through turns, departures and terrain, then convert to current model space. A terrain landing also retains its support plane. Swing interpolates both adjacent landings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan world points from landed states, optionally blend one next point/rotation, and apply the inverse current body placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The current yaw establishes only the relative readback and cannot reorient a planted sole in the world.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over at most two admitted stances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses existing rigid frame, vector and quaternion arithmetic. The route and gait already own the touchdown states.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh footprint and retains nothing between calls.
