# src/posture/HumanArmTrajectorySweepBound.ts#HumanArmTrajectorySweepBound.chords

## @evidence contracts/development/common.md#meaningful-documentation

States the course it bounds, the carried frame, the seconds it is timed by and when no bound is given.

## @evidence contracts/development/implementation.md#principled-implementation

The motion bound of conservative advancement (Mirtich 1996, PhD thesis, ch. 3) for the course the sweep reads: the course is its chords, so the chords' lengths per frame step are exactly how far their ends move, and their integral (`AutoMovieMotionBound.prepare`) bounds how far any later chord's ends lie from an earlier one's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Turns the course into per-step speeds and hands the integral to the engine's motion bound, which owns the closed-form reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance and no sampling: the speeds are the chords' own lengths; a course whose frames share an instant gets no bound and is read as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) for n frame steps, once per sphere and shape of an interval; each later read is O(log n).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; the sweep keeps the returned bound for that one course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned bound holds the per-step seconds and a prefix of n + 1 numbers, released with the sweep's loop over that course.

# src/posture/HumanArmTrajectorySweepBound.ts#HumanArmTrajectorySweepBound.solids

## @evidence contracts/development/common.md#meaningful-documentation

States which points it bounds, the frame they are carried into, the seconds it is timed by and when no bound is given.

## @evidence contracts/development/implementation.md#principled-implementation

The motion bound of conservative advancement (Mirtich 1996, PhD thesis, ch. 3) for the part's casts: a step's cast is the hull of the part's solids' points at its two frames, carried as `HumanArmTrajectoryLinks.cast` carries them, so the farthest any of those points moves per frame step, integrated (`AutoMovieMotionBound.prepare`), bounds how far a later cast's points lie from an earlier one's. Solids that change in number, points or radius between frames have no point correspondence and get no bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Carries the points once per frame, takes each step's farthest move, and hands the integral to the engine's motion bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance and no sampling: each step's speed is the measured farthest move of the very points the casts are hulls of.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n p) carries for n frames and p solid points, once per part and shape whose interval cast fails; each later read is O(log n).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; the sweep keeps the returned bound for that one part and shape.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds two frames' carried points at a time while preparing; the returned bound holds n + 1 seconds and prefix numbers, released with the sweep's loop over that pair.
