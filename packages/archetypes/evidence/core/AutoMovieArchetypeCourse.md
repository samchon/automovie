# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.Leg

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A leg is either straight or a turn, discriminated by `kind`, each with the members every leg may carry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by `plan` and by the rides that check each turn.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A discriminated union, not one record with an optional radius and angle.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ILegBase

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit, default and the rule it obeys.

## @evidence contracts/development/design.md#principled-representation

A rise in metres over the leg's horizontal run, a flag for driving backward along it, and a pause in seconds; `plan` refuses one that is malformed or a pause where the support does not stop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the members #3493 asks every leg to take, read by `plan` and by the rides that reverse or refuse reversing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reversing is a flag, never a negative speed, so a speed keeps its meaning.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IStraight

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A straight leg by its positive horizontal length in metres; `plan` refuses a length that is not.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; one of the two alternatives of `Leg`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries no radius or angle, so a straight cannot turn.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ITurn

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A circular arc by its positive horizontal radius in metres and its nonzero signed angle in degrees, positive to the left; `plan` refuses either when malformed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; one of the two alternatives of `Leg`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The direction is the angle's sign, not a second member that could disagree with it.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit, default or meaning.

## @evidence contracts/development/design.md#principled-representation

A start pose on the floor in metres and degrees, legs in order, a positive cruising speed in metres per second and two positive rates in metres per second squared, each absent when the course never reads it, and the optional marks: a speed at each leg's end, start and end speeds and a start second. Every optional member's absence plans as a course without it did; ranges, the marks' count and their reachability are left to `plan`, which refuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; authored by a scene and read by `plan` and by each ride.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `endSpeed` and `speeds` both name the speed at the course's end, so `plan` refuses the two together rather than choosing one.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

A point in metres at a film second; finiteness and order are left to `timed`, which refuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; an entry of `ITimed.samples`, such as a formation slot's path (#3458).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ITimed

## @evidence contracts/development/common.md#meaningful-documentation

States what it is.

## @evidence contracts/development/design.md#principled-representation

The samples in time order; `timed` plans them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the `course` of a timed plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IState

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Where a support is at one second: distance in metres along the path, speed in metres per second never negative, the signed distance a wheel rolls, signed curvature of the path seen from above per metre (positive where the path bends to the left of the way the support travels), whether it travels backward, and the root's placement in the world with unit scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; produced by a plan's `at` and read by each ride's pose function, `lean` and `banked`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; the placement is the interface package's transform.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IBend

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and which field each refusal names.

## @evidence contracts/development/design.md#principled-representation

A radius in metres and a speed in metres per second, the inputs of the steady-turn balance and of a steering lock, with the course fields at fault.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; listed by a plan and read by `admitLean` and `admitRadius`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.ILegSpan

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

A distance interval in metres along the path and a speed in metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; listed by a plan of legs and read by a ride that acts by leg, such as a horse's gait named per leg.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The planner measures it once; no ride measures a leg again.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A course with its timing: length in metres, the second it ends, peak speed, labelled instants in time order, its bends, its legs' stretches with their fastest speeds, and two samplers that are pure functions of distance and of seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; returned by `plan` and `timed` and read by every ride and by `AutoMovieArchetypeRide`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: plain data and two functions.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IPlan.when

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and what is returned outside the course's range.

## @evidence contracts/development/implementation.md#principled-implementation

The speed profile inverted in closed form for a course of legs, or the arc length inverted by Newton's method for a timed one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the planner's inverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A distance outside the path is held at its nearer end, never extrapolated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per phase or table row searched.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the tables the planner computed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the plan's own closure.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.IPlan.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and what is returned outside the course's range.

## @evidence contracts/development/implementation.md#principled-implementation

Distance and speed from the profile, then the leg that holds that distance advanced along its line or arc; or the timed path's interpolation at that second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Time to distance, distance to leg, leg to placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A second outside the course holds the nearer end state, never extrapolated.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of the legs or a search of the samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the tables the planner computed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the plan's own closure.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the balance, the unit and the sign, reversing included.

## @evidence contracts/development/implementation.md#principled-implementation

The steady-turn balance of a point mass on a thin tyre, the arctangent of speed squared times curvature over gravity (Wikipedia, Bicycle and motorcycle dynamics, after Fajans 2000 and Cossalter, https://en.wikipedia.org/wiki/Bicycle_and_motorcycle_dynamics, not read at the primary); a real tyre's width adds a few degrees, left out. The pull is toward the path's inside, which a reversing vehicle has on its other side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression and its side.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.banked

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

The placement's rotation followed, in the vehicle's own frame, by a roll about its forward axis `+Z`; a right-handed roll about `+Z` tips `+Y` toward `-X`, the right, so a lean to the left is the negative roll.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quaternion product.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's quaternion arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.admitLean

## @evidence contracts/development/common.md#meaningful-documentation

States the limit's unit and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The balance of `lean` solved for the radius, the speed squared over gravity times the tangent of the limit, or for the speed, the square root of gravity times the radius times that tangent. A leg's top speed bounds every second of it, so a bend admitted here leans within the limit throughout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plan unless planned, then one pass over the bends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bend beyond the limit is refused, never flattened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bends.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads a plan the caller already has.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.admitRadius

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A comparison of each bend's least radius with the support's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the bends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bend beyond the limit is refused, never widened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bends.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the caller's plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the bit-for-bit promise and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation `ArchetypeCourseLegs.plan`: the legs measured on the ground and along their grade, the engine's speed profile over them, and each sample advanced along its leg's line or arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the module that owns the legs' geometry.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owner it calls.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

As `ArchetypeCourseLegs.plan`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One plan serves every sample of a ride.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the course and one table row per leg for as long as its caller keeps it.

# src/core/AutoMovieArchetypeCourse.ts#AutoMovieArchetypeCourse.timed

## @evidence contracts/development/common.md#meaningful-documentation

States what the plan does with the samples and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation `ArchetypeCourseTimed.plan`: a C1 cubic Hermite interpolation of each coordinate in time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of the module that owns the timed path.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing beyond the owner it calls.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

As `ArchetypeCourseTimed.plan`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One plan serves every sample of a ride.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the samples and its arc-length table for as long as its caller keeps it.
