# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the two windows, the unit and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

Axial rotation of the trunk is mostly thoracic, the lumbar spine allowing little, so the chest takes the larger stated share and the spine the rest, and the two sum to the asked twist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call with the two joints' twists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is the named constant `CHEST`, a modelling choice for a rig with two trunk joints; the pelvis is not turned, which is the root's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanJoints.pulse`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.footing

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the frame and that either kind of leg is read.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of the resolved posture reads the foot bones' world frames, so a leg written as goals reads where its solve put it and a leg written as angles where its angles put it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy exact FK workspace feeds the full resolution and final two-foot observation, followed by two lookups.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the feet are read, never rebuilt from a stance width.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every limb/digit/contact still fits fully; final FK admits every authored joint but transforms only foot ancestry, sharing exact unchanged work already performed during that solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A local same-operation reader serves the actual full fitting and final foot FK; changed joint/root dependencies remain checked, without solved-pose or time-result reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The getter and temporary map end with synchronous return or throw; only the two fresh foot placements escape.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.planted

## @evidence contracts/development/common.md#meaningful-documentation

States what is written, why the knee bends and each input.

## @evidence contracts/development/implementation.md#principled-implementation

A foot that bears stays on the floor and the leg is solved onto it by inverse kinematics (the effector goals of the motion skill), through the one goal builder `AutoMovieMotionHumanLeg.goal`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal per named leg.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per leg.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.preparePlanted

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/placements/ordered selection, both-leg default, duplicate order, current posture inputs and fresh/borrowed output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Each selected leg uses the existing Leg.prepareGoal producer for the same planted ankle, foot rotation, actual root/yaw knee and toe contact; all remaining posture fields and limb goals stay as originally spread.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed goal reader per distinct selected side precedes the original ordered limb-map writer; prepareCrouch and fixed-foot dive share this same preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cold planted entry keeps live inputs unchanged. Explicit fixed geometry alone is shared; every selected visit writes its actual goal, including duplicates, and no joint, contact, ROM check or target is replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two fixed goal readers serve Q writes, avoiding repeated fixed foot heading/contact and exact-yaw knee prerequisites; every actual root transform, ordered goal write and fresh output map remains. Improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller establishes unchanged body, foot placements and leg selection. Current root/yaw and every raw posture/goal remain live inputs, while the leg owner guards exact rotation metadata and owns its original numerical knee/contact formulas.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning action holds the borrowed fixed selection/feet and at most two bounded goal readers until release. No current posture, returned limb map, target result, FK/ROM loan or time history is retained.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.sunk

## @evidence contracts/development/common.md#meaningful-documentation

States what is lowered, moved and inclined, who shares the inclination and each parameter's unit.

## @evidence contracts/development/implementation.md#principled-implementation

Folded thighs use up the hip's flexion range, so a deep crouch inclines the trunk through the spine rather than the pelvis (Esola et al. 1996 for the rhythm); a pelvis pitched past the range would pull the planted feet off the floor. The limit is read over the leg goals' ankles with the hips at their sunk place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hips goal from the posture's own heading, one incline and one root placed under the pitched hips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posture without both leg goals has no thighs to read, so its pelvis takes the rhythm's full share; the hips' place is read through the posture's whole heading, so a pitched posture keeps its hips and a zero share writes no movement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the split and the limit to `HumanTrunk`, the owner the bend, the sit and the rise read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.crouch

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, why the knees bend whatever the entry, the channels and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Standing balance keeps the centre of mass over the base of support, so the hip shift is solved by `HumanBalance.shift` on the lowest pose, over the feet where they bear, and scaled with the depth and the pitch by the clock's envelope. The shift is solved once on the standing posture with its legs planted, so between the ends the balance is the linear share of the solved one, not solved again. The feet are read once off the resolved standing posture, the place the body is displayed standing on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper builds the lowered and planted pose for a share; it serves both the solve and the write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative or non-numeric depth or pitch throws; no shift is stated; the feet are the posture's own, never a stance rebuilt from a width.

## @evidence contracts/development/implementation.md#efficient-algorithms

The balance and the feet are solved once when the phrase is built, not per evaluated second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the lowered pose to `sunk`, the solve to `HumanBalance.shift` and the leg goals to `AutoMovieMotionHumanLeg.goal`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive keeps its arguments and the bounded prepareCrouch writer: two feet, at most two fixed goal readers and one solved shift, without sampled posture results.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.prepareCrouch

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged geometry, world/clinical units, caller-supplied clock share and preparation failure.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the standing feet once, plants before sinking and uses the original HumanBalance.shift at full depth. Each write applies exactly the original scaled depth, pitch and solved hip shift through sunk and planted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two fixed foot-goal readers feed the same planted posture before and after sunk; one low builder serves the static search and dynamic writes while each clock supplies its actual share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every write still reads its actual incoming posture and the original share; the balance search, ROM, plant goals and tolerance are unchanged, and no representative repetition replaces another repetition's clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

One footing solve and original bounded balance search serve all R identical repetitions. Each selected fixed foot heading/contact prepares once across both plant stages and all trials/writes; actual knee transforms, trunk arithmetic and every leg goal remain, with no measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The consumer explicitly shares only fixed body, stance, depth, inclination and selected leg geometry through Leg.prepareGoal; a changed one requires fresh preparation. Incoming posture, root/yaw, knee hints and share remain actual per-write inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function owns two foot frames, at most two bounded fixed-goal readers and one solved shift until its action ends. The search's trial readings do not survive preparation and no time-indexed history is kept.

# src/compose/AutoMovieMotionHumanTrunk.ts#AutoMovieMotionHumanTrunk.counterbalance

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the two windows, which pose the shift is solved on and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A limb held out ahead moves the centre of mass forward, and the body answers by moving the hips back; the shift is the one `HumanBalance.shift` finds for the extended pose, applied along the heading by the clock's envelope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve and one excursion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No distance is stated, and a pose already balanced solves to no shift; a pose no shift balances is refused with the measured remainder instead of being shown falling.

## @evidence contracts/development/implementation.md#efficient-algorithms

The balance is solved once when the phrase is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanBalance.shift`, `AutoMovieMotionHumanRoot.place` and `AutoMovieMotionHumanRoot.excursion`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive keeps the clock, the windows and one solved number; the extended posture is read only during the solve.
