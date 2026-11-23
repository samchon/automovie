# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Gives film start, speed/rate units and empty-profile behavior.

## @evidence contracts/development/design.md#principled-representation

speedProfile admits finite start, nonnegative speeds and positive supplied acceleration magnitudes; a changing stretch requires its corresponding rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The speed-profile planner consumes ordered path stretches and retains initial-speed access through the at reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Acceleration and braking are independently optional because constant-speed and one-sided changes do not need both rates.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.Stretch

## @evidence contracts/development/common.md#meaningful-documentation

Separates a distance-constrained endpoint from a duration-constrained endpoint.

## @evidence contracts/development/design.md#principled-representation

The kind union makes length/cap and seconds exclusive descriptions of one stretch, with endpoint speed in metres/second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

speedProfile selects its distance or constant-acceleration timing branch from this discriminant.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional-field combination can describe a stretch with neither timing basis.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IDistance

## @evidence contracts/development/common.md#meaningful-documentation

Specifies positive path length, endpoint speed and attainable cap semantics.

## @evidence contracts/development/design.md#principled-representation

speedProfile checks finite positive length/cap, nonnegative speed, cap above both endpoints and reachability under the supplied rates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The distance branch computes acceleration, cruise and braking phases from this request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The discriminator separates distance planning from a caller-prescribed duration; the cap need not actually be reached on a short stretch.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.ISeconds

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a positive duration and endpoint speed for one constant-rate transition.

## @evidence contracts/development/design.md#principled-representation

speedProfile admits positive finite seconds and nonnegative finite speed, then checks the required signed rate against acceleration or braking.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The duration branch derives travelled distance from mean endpoint speed times duration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A stationary hold is representable with zero endpoint speeds and does not require an acceleration rate.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

Gives absolute film times, path distances, signed acceleration and the speed anchor.

## @evidence contracts/development/design.md#principled-representation

start/end are film seconds, from/to are metres from path start, and speed is evaluated at the indicated phase endpoint; zero-duration phases may be present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

speedProfile returns these phase records and its at/when closures read the same array, so clients keep it stable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An explicit anchor distinguishes reverse-evaluated braking from start-evaluated acceleration without overloading the speed field silently.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IStretch

## @evidence contracts/development/common.md#meaningful-documentation

Defines laid stretch timing, distance bounds, peak and durations of its three phases.

## @evidence contracts/development/design.md#principled-representation

Film-time endpoints and path-distance endpoints share the profile origins; up/level/down are elapsed seconds, with possible rounding residue in level.

## @evidence contracts/development/design.md#minimal-and-owned-surface

speedProfile publishes per-stretch summaries alongside finer phases for consumers needing stretch boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The summary is derived from the same solve rather than an independently authored timing track.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IState

## @evidence contracts/development/common.md#meaningful-documentation

Defines distance, speed and signed acceleration at one profile time.

## @evidence contracts/development/design.md#principled-representation

Distance is metres from path start, speed metres/second and acceleration metres/second-squared; held external samples have zero acceleration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The profile's at reader allocates this measurement from its retained phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A held end position may still report endpoint speed; it is the clamped profile state rather than extrapolated motion.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

States time and distance readers, retained-phase ownership and trailing-hold inverse timing.

## @evidence contracts/development/design.md#principled-representation

start/end share film time, length starts at zero and peak uses metres/second; at holds endpoints and when returns the first clamped-distance occurrence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

speedProfile owns construction; returned closures read retained phase data and callers preserve the mutable records while sampling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The inverse reader resolves an actual first reach rather than claiming every distance at or beyond length first occurs at end.

# src/motion/IAutoMovieSpeedProfile.ts#IAutoMovieSpeedProfile.IReachResult

## @evidence contracts/development/common.md#meaningful-documentation

Gives lower and upper physically reachable endpoint speeds.

## @evidence contracts/development/design.md#principled-representation

Both bounds use metres/second; minimum clamps the braking radicand at zero while maximum is the acceleration bound. reach itself performs no numeric admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

speedProfile.reach computes this interval from the caller's entry speed, length and rates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record expresses a numeric interval and does not attach success to a particular requested mark.
