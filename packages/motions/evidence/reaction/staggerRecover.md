# src/reaction/staggerRecover.ts#staggerRecover.IStep

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and frame.

## @evidence contracts/development/design.md#principled-representation

The foot, its two placements and its swing's window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, read by the plan and the tests.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the foot's placement.

# src/reaction/staggerRecover.ts#staggerRecover.IRecovery

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and frame.

## @evidence contracts/development/design.md#principled-representation

The steps, the courses of the centre of mass, the centre of pressure and the extrapolated centre of mass along the push and the instant it settles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Inherits the single shared ICourses callable contract and adds steps, caught point and settled time; planning, admission and displayed feet read these values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The courses are functions of the seconds, not tables.

# src/reaction/staggerRecover.ts#staggerRecover.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

States action-local start seconds, entry-relative world-metre pressure/travel and world-metre-per-second velocity.

## @evidence contracts/development/design.md#principled-representation

A held-pressure inverted-pendulum interval is fully specified by these four initial conditions, with frequency owned by its pendulum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Actual integration writes each field and individual/paired course readers consume every one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stores the actual integrated interval's initial state, without a sampled pose, inferred pressure or quantized time key.

# src/reaction/staggerRecover.ts#staggerRecover.IState

## @evidence contracts/development/common.md#meaningful-documentation

Members identify placed feet, actual phase/step records, entry-relative travel/velocity and action-local seconds.

## @evidence contracts/development/design.md#principled-representation

These six fields are the complete changing pendulum state; fixed body/entry/push/speed remain with the owning search.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Snapshot and restore share these same fields, and recovery retains only prefixes consumed by later foot orders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Holds actual dynamic records rather than fitted playback data; callers preserve the original immutable nested records while collection wrappers are copied.

# src/reaction/staggerRecover.ts#staggerRecover.ICourses

## @evidence contracts/development/common.md#meaningful-documentation

Each reading states its frame and the common action-local clock.

## @evidence contracts/development/design.md#principled-representation

Three scalar-time readers of the same integrated phases and settling tail.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The admission and the displayed feet read the travel, the trunk the extrapolated centre; the pressure is the plan's record of where the feet bear.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No phase is approximated or cached by time.

# src/reaction/staggerRecover.ts#staggerRecover.ICourses.course

## @evidence contracts/development/common.md#meaningful-documentation

Reads seconds since the push and returns the current horizontal entry-relative centre travel in world metres.

## @evidence contracts/development/implementation.md#principled-implementation

Producers use the original held-pressure closed-form pendulum before the settling tail and the original adjacent-sample linear interpolation during settling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pendulum and settling owners retain their existing formulas behind this one shared course contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps original phase selection, duplicate-start behavior, clamped endpoints and tail interpolation without resampling or changing trajectories.

## @evidence contracts/development/implementation.md#efficient-algorithms

A pendulum read binary-searches P retained phases, O(log P); a settling read indexes two tail points in constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call reads the retained phase/tail data afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader borrows actual phase/tail arrays for the owning recovery lifetime and returns a fresh vector without retaining queried times.

# src/reaction/staggerRecover.ts#staggerRecover.ICourses.pressure

## @evidence contracts/development/common.md#meaningful-documentation

Reads action-local seconds and returns the current supported pressure in world-floor coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original selected phase's held pressure before settling and original held millisecond pressure sample during the settling tail, translated by entry centre and flattened.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Phase selection and tail indexing remain with their respective existing course producers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps exact phase/tail selection, floor projection and all original support pressure samples without a changed bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log P) phase lookup before settling or O(1) tail lookup afterward, with one fixed-size output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No pressure result is reused at a different time or phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only original recovery-owned phase/tail data and returns a fresh vector with no query history or external handle.

# src/reaction/staggerRecover.ts#staggerRecover.ICourses.extrapolated

## @evidence contracts/development/common.md#meaningful-documentation

Reads action-local seconds and returns the original capture point in world-floor coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

Uses xi-p growing as exp(omega*t) on the selected held-pressure phase, or the original settling tail's adjacent xi interpolation, then applies entry-centre translation and floor projection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same original pendulum/tail owners compute capture points independently of merit or posture fitting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps actual initial travel/velocity, frequency, all tail samples and endpoint clamps without a fitted capture path.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log P) phase lookup or constant two-point tail interpolation, with constant vector result size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current extrapolated value is computed from the retained physical data.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Original phase/tail arrays live with the recovery; each output is fresh and no sampled-time cache is retained.

# src/reaction/staggerRecover.ts#staggerRecover.recover

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the pruning's premise and the null.

## @evidence contracts/development/implementation.md#principled-implementation

Hof's pendulum with its centre of pressure as near the extrapolated centre of mass as the bearing feet reach; each step's time and place within the measured bounds and its reachable footstep region, the orders of the feet searched for the fewest steps (Koolen et al.'s N-step capture); caught once the extrapolated centre of mass is inside the two feet's base; then the closing step and the settling (`staggerClose`), and the legs' two-bone admission of every step at its mid-swing and landing, of the close and of the rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pendulum per order of the feet, each step by `staggerStep`; the first order that catches, closes and is admitted is kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A push no order of `STEPS` steps catches is null, never a shortened bound; every bound is measured and cited, and a landing the legs do not hold is shortened inside the region or refused. The pendulum prune rests on the stated premise that a shortened landing never catches what the aimed one misses.

## @evidence contracts/development/implementation.md#efficient-algorithms

A refused push: at most 30 closed-form pendulum prefixes and no admission. A caught one adds the admitted search: at most 30 prefixes, each one mid-swing admission and at most 3 + log2(1 / ADAPTED) landing admissions (one ground settling each, two leg fits where the feet cross); no stance course or quadratic program is solved.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exactly shared foot-order prefixes reuse their state, admitted landings included, within this recovery: a prefix's steps and its course up to its last landing are the same in every order that begins with it. The entry's fixed geometry is shared across a search's speeds through `fixed`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the shared prefixes for the search only.
