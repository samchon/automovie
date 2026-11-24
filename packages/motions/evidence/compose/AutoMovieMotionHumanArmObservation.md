# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.reaching

## @evidence contracts/development/common.md#meaningful-documentation

States the timing, its source and the arc it reads.

## @evidence contracts/development/implementation.md#principled-implementation

The two-factor reach-to-grasp movement time of the wrist's arc on the blend.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One base pose, the arcs sampled along the blend, one movement-time reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arc is measured on the blend the arm takes, not on the straight line between the ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

One original base solve and N+1 actual blended poses, N the chords that hold an arm-length half-turn's shortfall within a millimetre, retain their original arc integration. Each FK read admits every authored joint but resolves only the three probes and their ancestors; one operation reader shares unchanged scalar FK prerequisites. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses blendHumanJoint, HumanArmClearance.posed and poseBones. The actual removed-arm raw posture receives ordinary native admission/fitting; one local FK reader shares only fixed joint/rest/ancestor prerequisites across actual blend samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The base pose, three probe names and local exact FK reader live only through this synchronous measurement. Only the prior probe points and three accumulated arc lengths survive between samples; no blend-pose history, reader or callback enters the returned scalar.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.reachingPose

## @evidence contracts/development/common.md#meaningful-documentation

Defines the supplied actual base, replaced arm joints, preserved finger/ancestor dependencies and second-valued duration.

## @evidence contracts/development/implementation.md#principled-implementation

The three arm joints are replaced at every sample; all remaining FK dependencies come from the supplied solved base. N+1 samples measure its actual elbow, wrist and fingertip arcs, and the two-factor reach-to-grasp model times the wrist's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

reaching owns raw-posture admission/resolution, this companion owns identical probe integration, and the existing single-arm planner supplies its already completed exact removed-arm base.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sample, blend, arc increment or tolerance changes. Multiarm planner bases still use the original raw resolver because removing both arms differs from removing only the measured arm.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each query keeps N+1 actual probe blends/FK admissions and original integration; a valid existing canonical base avoids one duplicate solve. Three fixed-pair blenders prepare endpoint rotation/chart data once at first interior use, while every original share and clinical readback remain actual. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The single-arm planner's at(t).pose resolved exactly the same body/posture after removing that sole arm goal; its body and raw posture stay unchanged during this synchronous planning query. An explicit same-body operation may lend exact FK metadata from native base/endpoint solves to every original probe. Cold reaching still resolves its actual raw base normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the caller's completed base and optional exact FK source only until the scalar returns, with a local getter, prior probe array and three accumulated lengths. No new time/pose history or numerical result is retained, and no source enters the scalar result.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.longest

## @evidence contracts/development/common.md#meaningful-documentation

States the arcs read and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The same blended probe samples `reachingPose` integrates, their longest arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One blend sampling and one maximum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arc is the blend's, not the chord between the ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

N+1 blended poses with the three probes' FK, as `reachingPose`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the blenders and FK reads `reachingPose` uses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the scalar.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.reachingGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends, the one base and when the end's arm is fitted on it.

## @evidence contracts/development/implementation.md#principled-implementation

The posture's solve fits the legs first and this arm last, so under `isHumanArmAlone` the arm fitted alone on the pose without it is the arm the solve gives; otherwise the posture is solved with the goal as before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One base, one end arm, then `reachingPose`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posture whose other limbs couple with the arm keeps the whole solve; no arc sample or bound changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve without the arm and one arm fit, where the caller's own posture solve with the goal and `reaching`'s base made two posture solves; then `reachingPose`'s samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The base is the pose `reaching` resolves from the same posture with the same arm left out, shared by the end's fit and the arcs within this call; one exact FK reader serves all three.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The base, the fitted pose and the reader end with the call; only the scalar escapes.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.moved

## @evidence contracts/development/common.md#meaningful-documentation

States the two sites, the pose they are read on and when the result is zero.

## @evidence contracts/development/implementation.md#principled-implementation

A feedback term is driven by error: the target's motion since the feed-forward plan perceived it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One base pose, two goal reads, one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both sites are read on the same pose, so the posture so far cancels and only the target's motion is left.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve and two goal reads per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Native removed-arm placement and both current/perceived attached-site observations share one exact local FK getter. Every actual goal callback, world attachment transform and target difference still runs; no fitted pose/site result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The invocation owns its lazy exact reader until return/throw; the returned error/contact/base keeps original numerical payloads and no reader, callback or operation history.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.aim

## @evidence contracts/development/common.md#meaningful-documentation

Defines perceived callback precedence and forwards the actual posture/local seconds plus optional same-body FK/genuine ROM metadata for this synchronous invocation only.

## @evidence contracts/development/implementation.md#principled-implementation

The carry explicitly supplies a perceived goal for planning; when absent its ordinary actual goal defines the same target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional callback selection and one invocation share this rule between planner and feedback observation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No returned goal, reaction time or posture is altered and no callback result is cached here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant dispatch plus the actual supplied target's work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The parent may lend same-body FK and genuine ROM metadata to the actual callback; no callback result, pose or query history is shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state and returns the callback's original goal ownership.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.site

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre goal seating, end-frame contact offset, optional orientation/task limits and the carry's disc clearance.

## @evidence contracts/development/implementation.md#principled-implementation

HumanLimbFit.world seats attached goals first; the goal's end rotation then carries its end-local contact offset from wrist to world contact point, with identity when rotation is absent, as in the original site rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared attached-goal conversion and one site record serve trajectory planning and feedback comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original contact, limit, disc and orientation fields remain; no wrist-origin approximation substitutes for a declared contact pivot.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant rigid-frame arithmetic plus any actual attached-goal FK required by the shared resolver.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Planning and feedback use the same conversion; a same-body parent may lend exact FK metadata for the actual on-bone's demanded ancestry. Different poses/goals still run their original attachment conversion, with no site cache or eager FK for world goals.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The fresh site borrows unchanged goal payloads and retains no operation reader, body cache or handle.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.ISited

## @evidence contracts/development/common.md#meaningful-documentation

States which of a carry's members a site reads.

## @evidence contracts/development/design.md#principled-representation

A pick of the planned carry's own members, so a site reads the same values the carry holds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The side, the skin distance and the disc, all `site` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/compose/AutoMovieMotionHumanArmObservation.ts#AutoMovieMotionHumanArmObservation.based

## @evidence contracts/development/common.md#meaningful-documentation

States what a base holds, what each arm's own view holds and why one hand's rest is no other arm's.

## @evidence contracts/development/implementation.md#principled-implementation

The obstacles are every goal's cleared segments and the rests the segments each hand is laid on, read on the hold alone; with two arms each reads a view of its own (`IBase.arms`): every goal's cleared segments and only its own goal's rests, so a segment one hand rests on (a steadying palm's presented hand, which the ring hand slides onto) is no obstacle or rest of the other arm unless a goal clears it, and the other arm itself is read as the crossing pair on its own course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One union base, and with two arms one view each, built once per instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment a goal names is read by the arm that goal is for; none is dropped for a fixture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the goals' segments; the views are stable records, so the frames built on them are built once (`HumanArmFrame.of`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps one base per instant, read however often the refinement asks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records of borrowed segments and retains nothing.