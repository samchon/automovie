# src/handling/HumanPrehension.ts#HumanPrehension.duration

## @evidence contracts/development/common.md#meaningful-documentation

States skill, duration draw stream, metre travel and width and the seconds returned; the namespace cites the movement-time and cross-task variability models.

## @evidence contracts/development/implementation.md#principled-implementation

The two-factor nominal time (McIntosh et al. 2018) varied by HumanSkill.jitter's constant-plus-proportional timing variance (Wing and Kristofferson 1973), floored positive there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One nominal call feeds the skill-variation owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Amplitudes below the study's shortest take its value rather than an extrapolation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar, logarithm and draw work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares nominal and HumanSkill.jitter with the other timed actions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.nominal

## @evidence contracts/development/common.md#meaningful-documentation

Defines metre wrist travel and grasp width and the unvaried seconds under the cited two-factor model.

## @evidence contracts/development/implementation.md#principled-implementation

AutoMovieMotionHumanTiming.aimed evaluates McIntosh's coefficients with the shortest-amplitude floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to the aimed movement-time owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The coefficients are the study's group fit.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prehension and the other aimed actions share one formula.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.carry

## @evidence contracts/development/common.md#meaningful-documentation

States loaded travel in metres, the seconds returned and the provisional CARRY_PEAK with the peak-to-mean relation.

## @evidence contracts/development/implementation.md#principled-implementation

The larger of the unloaded nominal time and the time whose minimum-jerk peak speed, 15/8 of the mean (Flash and Hogan 1985), is CARRY_PEAK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One nominal query and one speed bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The peak speed is named provisional at its declaration.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant formula work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses nominal rather than copying its formula.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.aperture

## @evidence contracts/development/common.md#meaningful-documentation

States the metre units and the namespace's cited slope and provisional intercept.

## @evidence contracts/development/implementation.md#principled-implementation

The linear aperture-width relation of Smeets and Brenner 1999, APERTURE_SLOPE * width + APERTURE_INTERCEPT.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression of two named constants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clipping or margin.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One multiplication and one addition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every pre-shape reads this one relation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.peak

## @evidence contracts/development/common.md#meaningful-documentation

Defines the stream and the seeded peak share in the cited 0.6-to-0.7 band.

## @evidence contracts/development/implementation.md#principled-implementation

A uniform draw of the stream's quantity 0 mapped onto Jeannerod's band, 0.6 + 0.1 * draw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One keyed draw and one affine map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seed varies the share only inside the study's band.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One draw and constant arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The draw is keyed by the supplied stream, so other draws are unaffected.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.transport

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre endpoints and setback, the approach direction, endpoint attitudes, second duration, the refusal and the point and turn readers returned.

## @evidence contracts/development/implementation.md#principled-implementation

One minimum-jerk unit for a direct reach, or two overlapping units superposed (Flash and Henis 1991) through the set-back approach point; the attitude slerps on a minimum-jerk share that finishes at APPROACH.start, also for a direct reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Units are prepared once; the readers delegate profiles, superposition and slerp to the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero setback takes the single unit, so its peak speed is the minimum-jerk 15/8 of the mean; times outside the transport read its ends.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The units are prepared once per transport.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readers hold at most two units and the endpoint rotations until released.

# src/handling/HumanPrehension.ts#HumanPrehension.shape

## @evidence contracts/development/common.md#meaningful-documentation

Defines the clinical-degree entry, open and closed shapes, the peak and share inputs, the clamped two-phase timing and the fresh angles returned.

## @evidence contracts/development/implementation.md#principled-implementation

Jeannerod's opening-then-closing aperture schedule, each phase on a minimum-jerk weight (Flash and Hogan 1985), blended by `prepareHumanShapeBlend`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One phase choice, one weight, one blend; `prepareShape` is the same schedule prepared for a plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The peak share itself belongs to the opening phase; a bone a shape leaves out reads as zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(D) work in the D digit bones, no geometry or IK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A plan that samples the schedule repeatedly prepares it once with `prepareShape`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh tuples and retains nothing.

# src/handling/HumanPrehension.ts#HumanPrehension.prepareShape

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed shapes and peak, the share input and the fresh angles returned, equal to `shape`'s.

## @evidence contracts/development/implementation.md#principled-implementation

The same phase choice and minimum-jerk weight as `shape`, over blends prepared once per phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two lazily prepared phase blends and one weight per share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each phase keeps its own key union, as `shape` does.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two O(D) preparations per plan, then O(D) per share.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A phase's blend depends only on its two shapes, which the plan holds fixed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the shapes and at most two prepared blends until it is released.
