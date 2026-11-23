# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IClock

## @evidence contracts/development/common.md#meaningful-documentation

Gives seconds for interval bounds and distinguishes temporal clock sampling from the unmodified spatial course plan.

## @evidence contracts/development/design.md#principled-representation

The interval comes from plan.when at distances zero and length, preserving authored cue offsets and flying boundary speeds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One prepared clock per ride, without exposing a mutable timing cache or another gait table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A continuation reader cannot admit a requested speed; ride input admission still calls the strict table operation.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IClock.movingAt

## @evidence contracts/development/common.md#meaningful-documentation

Defines film-to-moving seconds and a held hoof clock throughout a stop.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract the elapsed share of every hold's seconds, all of a stop's and the film-proportional part of a spread one's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered pass of the admitted stops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Running seconds and the requested path remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) for P authored pauses, with constant work when none are authored.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the stops from the admitted course with the inverse reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the fixed stop table survives preparation.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IClock.filmAt

## @evidence contracts/development/common.md#meaningful-documentation

Defines moving-to-film seconds, returning a stop's arrival at its held clock value.

## @evidence contracts/development/implementation.md#principled-implementation

Add the full earlier holds before mapping back to the authored timeline, and inside a spread hold its share at the hoof clock's changed rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered pass of the admitted stops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A held clock value can emit one event at arrival and cannot emit a new event inside the pause.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) for P authored pauses, with constant work when none are authored.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same admitted stop intervals as movingAt.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the fixed stop table survives preparation.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IClock.at

## @evidence contracts/development/common.md#meaningful-documentation

Defines film seconds, cue-aware boundaries and the separation from unmodified spatial sampling.

## @evidence contracts/development/implementation.md#principled-implementation

The prepared reader bounds only its time argument to start/end and delegates state construction to the admitted course plan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar time bound precedes one existing plan-state read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No distance, path, requested speed or source state is edited to create the boundary context.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant scalar work to the existing plan sampler's input-dependent cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every phase, support and nod clock reads the same prepared temporal domain and existing plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains the already owned plan and two scalar bounds; returned states are not cached and no external resource is acquired.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IClock.timing

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes committed-clock continuation from strict requested-speed admission and names its film-second input and declared gait output.

## @evidence contracts/development/implementation.md#principled-implementation

Read boundary-aware course context, retain raw timing in range, and hold an endpoint only for the declared zero-speed bridge or an adjacent supported legacy handover.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The prepared reader finds the selected range, evaluates the two permitted continuation reasons and delegates interpolation or refusal to strict timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Authored speed edges and undeclared domain gaps cannot acquire continuation; no tolerance, scene exception or source-table mutation supplies missing measurements.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one plan state, searches G gait ids, conditionally scans C boundary distances, inspects one adjacent range and delegates the selected R-row interpolation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the prepared ranges/boundaries, the shared temporal reader and the existing table interpolation rather than rebuilding a plan or gait.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the prepared plan/table references and bounded G/C context; timings are fresh results with no growing cache, frame history or external handle.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.create

## @evidence contracts/development/common.md#meaningful-documentation

States units, boundary-only temporal sampling, spatial preservation, legacy adjacent-domain continuation and the separately retained genuine-zero ramp bridge.

## @evidence contracts/development/implementation.md#principled-implementation

Clamp clock query time to the profile interval, then read raw timing in range. Outside it, retain an endpoint only for a declared zero-speed ramp or an already committed gait with adjacent-domain support across a non-speed transition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare interval bounds, gait ranges and zero-speed boundary distances once; each read applies the two explicit continuation reasons before delegating to strict table timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never clamp a requested speed, bridge an unobserved domain, mutate path distances or substitute an authored speed-availability edge for a measured legacy transition law.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares G declared gait ranges and C course boundary records once; each read locates the gait among G entries, inspects its own and one adjacent range, scans zero-speed boundaries only for a subminimum ramp, and delegates the selected gait's R-row timing interpolation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admitted plan, existing range scaling and strict timing implementation; the same reader owns phase, stance and nod clock context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the ride's plan/table references, G ranges and at most C zero-speed boundary distances; no frame samples, external handles or growing cache survive.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.collectedSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the units, the held endpoint and when the input passes through unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

A collected gait (`ITable.collected`) is entered by decelerating out of its parent; over that interval the stride keeps the collected cadence, which is the fastest declared collected row, while the stride length absorbs the remaining speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two range reads and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A speed above the parent's domain, or a gait without a declared parent, is passed through for the strict refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over the two ranges' end rows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeQuadrupedGait.range` for both domains.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedRideClock.ts#QuadrupedRideClock.IHold

## @evidence contracts/development/common.md#meaningful-documentation

States the film-second start, the seconds the hoof clock falls behind and the optional spread.

## @evidence contracts/development/design.md#principled-representation

A start and held seconds in film seconds, the same shape as a route pause, and the film seconds a spread hold covers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by the ride's technique planners and merged with the route pauses here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finiteness, a positive stop and a still-running spread clock are admitted at `create`.
