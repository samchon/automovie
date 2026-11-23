# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner

## @evidence contracts/development/common.md#meaningful-documentation

Precomputed deterministic support schedule and random-access phase sampling.

## @evidence contracts/development/design.md#principled-representation

The schedule uses film seconds and world X/Z placements in metres with radian yaw/pitch; reserved intervals and generated swings share one ordered history.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner constructs and freezes its owned schedule, indexes steps by bone and returns detached placements and step records from at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sampling accepts any finite time and a known bone, using initial/final planted poses outside its schedule. This plan requests kinematic support movement and does not observe physical landings.

# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

Floor-plane support anchor, heading, pitch and vertical clearance.

## @evidence contracts/development/design.md#principled-representation

point is [world X,world Z] metres, yaw about +Y and pitch about the support lateral axis are radians, clearance is metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner copies desired placements into its schedule and returns detached sampled placements; the swing helper uses a sine clearance arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Placement numbers must be finite; swing admission checks them, while the constructor checks desired placements as scheduling reaches them. A placement alone makes no actual contact promise.

# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner.IReservation

## @evidence contracts/development/common.md#meaningful-documentation

Authored interval during which one support is unavailable for automatically scheduled stepping.

## @evidence contracts/development/design.md#principled-representation

start and end are finite film seconds with end > start; bone must name a declared support and same-bone reservations may not overlap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner copies reservation data into scheduled reserved steps and samples the desired placement at their end.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The constructor admits identity and timing. A reservation governs scheduling rather than native contact, and its endpoint may lie outside the overall construction window.

# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner.IStep

## @evidence contracts/development/common.md#meaningful-documentation

A scheduled automatic swing or authored reservation with departure and landing placements.

## @evidence contracts/development/design.md#principled-representation

Inherited times and bone identify the interval; kind selects either interpolated swing sampling or a held reserved departure until end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner freezes schedule steps and returns structured clones through at; standalone step records remain mutable unless their owner freezes them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

from/to are requested placements, not measured landings. A reserved sample does not reconstruct the authored movement inside its reserved interval.

# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner.IState

## @evidence contracts/development/common.md#meaningful-documentation

Requested support phase and placement at one sampled film second.

## @evidence contracts/development/design.md#principled-representation

progress lies in [0,1], with zero before any step and one after a completed step; step is absent while planted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner.at returns detached mutable placement and optional step data, preserving its frozen schedule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

For reserved phases placement stays at step.from until the end; callers need their authored motion for the reserved trajectory. phase is a plan state, not observed contact.

# src/physics/IAutoMovieStepPlanner.ts#IAutoMovieStepPlanner.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Footfall geometry, pure placement samplers and numerical policy for a complete support schedule.

## @evidence contracts/development/design.md#principled-representation

Film times use seconds, rate ticks/s, distances metres and angles radians; pattern supplies support identities, phase ordering and minimum remaining support count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieStepPlanner consumes callbacks synchronously during construction and copies placements and reservations; it retains no callback after construction and propagates callback errors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The constructor checks interval, principal budgets, pattern and reservations. Callers supply finite scheduling margins, overlap, lever factors, heading results and complete desired placements; those auxiliary scalars are not all independently admitted.
