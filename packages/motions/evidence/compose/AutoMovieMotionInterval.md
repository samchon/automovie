# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.linear

## @evidence contracts/development/common.md#meaningful-documentation

The inputs are action-local seconds; output is clamped to [0,1], stepping at to when to-from is below 1e-12 seconds.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the exact original branch, comparison and subtraction/division grouping from AutoMovieMotionClock.linear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar function owns the ordinary and prepared interval rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reversed, zero and short spans keep the original step behavior; no interval is normalized or sampled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and no allocation per actual query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single numeric progress query coordinates no retained work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no data or handle.

# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.progress

## @evidence contracts/development/common.md#meaningful-documentation

States the window's seconds, the shared clock, the clamped [0,1] share and its holds outside the window.

## @evidence contracts/development/implementation.md#principled-implementation

The engine minimum-jerk share of this namespace's uniform progress. The profile holds at 0 and 1 outside [0,1], so the clamp leaves every proper window's value unchanged; a window under 1e-12 s steps at its close instead of dividing by its length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Laws with seconds rather than named instants read their windows here instead of restating the share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounding, sampled value or alternate easing; the original short-span step is the linear owner's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single scalar query coordinates no retained work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no data or handle.

# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed names, eager name admission, action-local seconds and returned reader lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The clock contract fixes named instants for its lifetime; reading each once produces the same numeric interval for every subsequent scalar query, and minimumJerk consumes the same uniform progress.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two original at calls and two scalar closures keep name resolution separate from repeated interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every actual second still runs the unchanged interval arithmetic and profile; no time rounding, sampled value or alternate easing replaces it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two map queries occur once rather than twice per one of Q reads; each read remains constant arithmetic, and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the fixed opening and closing seconds are shared. Different clocks or names prepare independently, and the caller must prepare anew if a custom clock changes its named times.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned record retains two numeric seconds and reader closures until its owning action releases it; no clock, time history, pose or external handle is retained.

# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Both members consume actual action-local seconds and return progress in [0,1] with the original short-span step.

## @evidence contracts/development/design.md#principled-representation

Uniform and minimum-jerk forms share one numeric interval; each is the same function the clock's named query defines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only linear and progress are exposed because current prepared consumers need these two forms.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sampled state, mutable clock reference or optional alternative representation is stored.

# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.IPrepared.linear

## @evidence contracts/development/common.md#meaningful-documentation

States action-local seconds and the prepared interval's clamped [0,1] output, retaining the original short-span step.

## @evidence contracts/development/implementation.md#principled-implementation

The method contract is the original numeric linear map; prepare supplies the reader using this namespace's linear owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar method separates actual queried seconds from the fixed named endpoints already owned by the producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No alternate easing, rounded sample or changed short-span rule is permitted by this interface.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This signature chooses no algorithm; prepare and linear document the actual constant-time arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The signature coordinates no completed work; the producing closure owns its fixed endpoint sharing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The declaration acquires no state or handle; prepare documents the returned reader's numeric lifetime.

# src/compose/AutoMovieMotionInterval.ts#AutoMovieMotionInterval.IPrepared.progress

## @evidence contracts/development/common.md#meaningful-documentation

States the [0,1] minimum-jerk result and action-local seconds of the same prepared interval.

## @evidence contracts/development/implementation.md#principled-implementation

The contract applies the engine minimumJerk profile to the same actual linear progress, preserving its fixed endpoint and short-span semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar method exposes the smooth form while the producer and shared linear owner retain interval arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The profile remains the cited engine profile rather than a fitted alternative or stored sample.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This signature chooses no algorithm; prepare documents the actual linear read and polynomial cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No evaluated answer is shared by this declaration; the producer owns fixed endpoints only.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The declaration owns no resource; the producing closure's lifetime and fresh actual reads remain with prepare.
