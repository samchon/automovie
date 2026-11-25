# src/animals/AutoMovieArchetypeQuadrupedMotion.ts#AutoMovieArchetypeQuadrupedMotion.swing

## @evidence contracts/development/common.md#meaningful-documentation

States what each share is.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum-jerk lift-and-place model: the foot is brought from its lift-off to its next landing along the stride by the minimum-jerk path (`minimumJerk`, Flash and Hogan 1985), and in height by the same path in forward then reverse time. Evaluate the first half through the engine owner and use its exact symmetry s(1-t)=1-s(t) for the second half, avoiding the polynomial's cancellation near completion. No gait source read gives a swing path's shape, so this is the minimum-jerk optimum for those two targets, not a measured trajectory: the foot leaves and meets the ground at rest in both directions and passes the clearance at the middle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One stable profile along and the same profile at a symmetric lift-time coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No negative-clearance clamp, numerical floor tolerance, changed target or species-specific phase patch hides endpoint overshoot; time reflection preserves the same quintic path.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's `minimumJerk`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedMotion.ts#AutoMovieArchetypeQuadrupedMotion.nod

## @evidence contracts/development/common.md#meaningful-documentation

States the sign and the three timings.

## @evidence contracts/development/implementation.md#principled-implementation `support`: the head and neck pitch nose-up in the latter part of each forelimb's support, so the nose is highest as each fore lifts off and lowest half a step before, twice a stride; `bob`: nose-down as the trunk sinks, twice a stride; `lead`: retraction, nose-up, from the leading forelimb's touchdown and protraction, nose-down, late in the airborne phase, so the nose is lowest at that touchdown, once a stride. The three are Dunbar et al. 2008's (J Exp Biol 211:3889) horse walk, trot and canter; a species states which it uses per gait.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cosine per timing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeQuadrupedGait.phase` for the leading fore's landing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
