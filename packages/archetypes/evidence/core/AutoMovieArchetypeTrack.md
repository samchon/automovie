# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The articulation's id, the film seconds the movement spans, a pure travel function in the articulation's own unit and the launch, if one was asked for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `swing` and `ease` and read by whatever poses the archetype at a second.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The travel is a function, not samples on a frame grid.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.ITrack.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, held ends and finite-clock refusal.

## @evidence contracts/development/implementation.md#principled-implementation

ArchetypeTrackTime admits the finite sample and selects exact held offsets before subtraction; the track reads its prepared solution only inside that span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit finite sample, select held endpoints, then read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Non-finite sample times are refused rather than clamped into an endpoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: a closed form, or one trajectory read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An integrated track reads the trajectory integrated once when it was made.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing per call.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.ILaunch

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The film second, the travel and its rate there, in the articulation's units per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; written by `swing` and `ease` and read by what releases a projectile from the part.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.IPendulum

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The moment about the hinge, the mass, the gravity lever and the travel at which the body hangs at rest: the four figures `I θ'' = -m g A sin θ` needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `pendulum` from an archetype, or by a producer for a part it knows, and read by `swing`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.agm

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Gauss's iteration, quadratically convergent, stopped at agreement or the existing 64-round bound. Ordinary normal inputs retain their order. A subnormal input pair is lifted by the common exact power2^52 when that cannot overflow, so every mean remains normal before final rescaling; a mixed pair too large for that lift already reaches two normal values after its first iteration. Overflowing means or subnormal/overflowing products use equivalent bounded mean and square-root factorizations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid inputs refuse without a clamp or guessed mean; exact homogeneous scaling prevents a subnormal quantization cycle and factorization changes only exceptional numeric evaluation, not the iteration.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most the existing 64 constant-work rounds; swing amplitudes converge within a handful.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.pendulum

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, that the whole model swings, its frame and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The moment about the hinge's rest axis by the parallel-axis theorem (`AutoMovieArchetype.moment`); the centre of mass's offset square to the axis turns as `r cos t + (a x r) sin t`, whose height is `A cos(t - phi)`, so the lever is that amplitude and the rest travel is `phi + 180` degrees, where the height is least.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the hinge, project the offset, then the lever and the rest travel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hinge gravity cannot turn is refused, never given a period.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetype.moment` and `AutoMovieArchetypeFrame.axis`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.swing

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the default body, the held end and the refusals; start and samples are finite, duration is positive and end must remain representably later.

## @evidence contracts/development/implementation.md#principled-implementation `I θ'' = -m g A sin θ` from rest: below `SMALL` the closed form `θ0 cos(ω t)`, whose period is within `PERIOD` of the exact one; above it the same RK4 owner solves d²θ/dτ²=-sinθ with τ=ωt and converts rate by ω. The fixed STEP value remains unchanged in this dimensionless phase coordinate, avoiding stiffness and tying preparation cost to physical oscillation rather than arbitrary time units. The single-well solution requires abs(release-rest)<180 degrees: the inverted equilibrium separates adjacent potential wells (NIST DLMF22.19(i), https://dlmf.nist.gov/22.19). Within that well energy is conserved, so the swing's reach is the release's distance past rest, checked against the range once. The launch is the closed form's first crossing `acos(θL / θ0) / ω`, or the integrated trajectory's first sign change bisected in phase with a difference-form midpoint; only an interior final phase converts to seconds, while phase endpoints map directly to clock endpoints. A strict interior event must retain an interior clock offset, so scaling cannot promote it to a held endpoint or overflow a physical-time bracket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Snapshot input scalars and admit the interval and physical figures, then prepare the solution and launch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

ArchetypePendulumFrequency admits custom finite positive figures and classifies every intermediate for frequency arithmetic; small-angle travel stays in degrees; release must stay within the declared rest well without wrapping its authored travel, and nonlinear phase step count and final launch rate must be representable; ArchetypeTrackTime owns interval/sample admission. No friction or air drag damps the swing: none was read; a stop that would end it is the producer's range, refused, not hit.

## @evidence contracts/development/implementation.md#efficient-algorithms

The closed form is constant work; separate scalar angle/rate closures avoid an unused derivative and paired-record allocation per read. Integration retains the engine step value on normalized phase with a finite safe discrete count, then reads in constant time; no global small resource bound is claimed for arbitrary long intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's one integrator; the trajectory is integrated once per track.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The track retains prepared scalar values and, when integrated, its trajectory for as long as its caller keeps it; later mutation of the input record does not rewrite the plan.

# src/core/AutoMovieArchetypeTrack.ts#AutoMovieArchetypeTrack.ease

## @evidence contracts/development/common.md#meaningful-documentation

States the profile, its source, its provisional use for a mechanism, each input and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Flash and Hogan's quintic starts and ends at rest with zero acceleration. The launch is its monotone crossing, found by bisection on the share with exact endpoint crossings; the rate `(x1-x0) 30 s^2 (1-s)^2 / T` uses the shared exceptional scalar quotient. The clock owner selects held endpoints before subtraction; a non-finite endpoint difference or final rate is explicitly outside this API's numeric domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, then the closed form and the launch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A travel outside the range, non-finite clock or unrepresentable span/rate is refused, never capped or clamped; no physical limit or old range margin changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per read; the launch's bisection runs once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call makes one independent track.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only prepared scalar snapshots and pure profile/clock closures, without the mutable input record or model.
