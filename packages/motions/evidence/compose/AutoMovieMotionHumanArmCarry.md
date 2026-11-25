# src/compose/AutoMovieMotionHumanArmCarry.ts#AutoMovieMotionHumanArmCarry.carry

## @evidence contracts/development/common.md#meaningful-documentation

States both ends, what is blended, why and what the result holds.

## @evidence contracts/development/implementation.md#principled-implementation

Free arm movements are smooth in joint space (Soechting and Lacquaniti 1981), so the transport blends the joints of the two ends and solves the goal only to read its joints; `blendHumanJoint` blends a ball joint as a rotation, which does not depend on the chart its triple is written in, and a joint with fewer freedoms angle by angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture solve (two with a planned arrival), then three blended joints and one clearing course per arm (`HumanArmClearing.course`, solved at fixed shares of the carry so the turn does not step between two instants), each arm cleared in the pose the arms before it were written into.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shoulder takes the shorter arc between its two rotations, so neither a twist near 180 degrees nor a solution in its other chart swings the arm; the share is clamped so the arm cannot pass either end.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve for both arms and a second for planned arrival when given, none at either end. Fixed joint pairs prepare endpoint rotation/chart only at first interior use; every course key still runs the actual blend/clearing. Two paired endpoint baseline observations replace four duplicate full FK/clearance reads; their original scalar projection/interpolation remains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Actual current/planned solves and baseline/cleared observations share one exact FK getter, optionally borrowed from the same-body parent; a genuine parent projector shares only direct ROM metadata. Body and endpoint triples stay unchanged during this carry, so between shares fixed endpoint preparation across original course shares; all varying poses, goals and clearing candidates remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous carry owns or borrows lazy FK/ROM metadata, existing per-key arm/pose maps and local course callbacks only until return/throw. No returned posture or goal retains the readers, projector, maps or callbacks.

# src/compose/AutoMovieMotionHumanArmCarry.ts#AutoMovieMotionHumanArmCarry.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the two ways an arm is carried, what each reads, the channel claimed and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A reach that lays a hand on a site is a motion-planning problem, solved as one trajectory over the action against the very postures it is written on (TrajOpt), so the plan is a constant of the action; a transport with no site keeps the joint-space carry (Soechting and Lacquaniti 1981). The planned arm is shown from its span's first instant, its rest, the arm the display shows as the course takes over, so a course that starts on its hold leaves from that arm and not from another fit of the goal there. With an attitude, the hand between the ends is solved to it on the carried arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The group joined once; per second the planned arm or one `carry`, whose goal an arm without a span solves continued along the action's course (`AutoMovieMotionHumanArmChain`), then one hand solve with an attitude.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The group is solved once, when its first member is prepared on the posture before it, and a member asked while it is being solved throws instead of solving twice, and a solve that refuses keeps its refusal (`ITogether.refused`), which every later read of a member throws again instead of solving again; the hand's fingers are not claimed, so a row that shapes them composes with this one; on its plan the arm plays its hand (`plays`): the fingers its plan carries in joint space, from the bases the planner read the hand by (`AutoMovieMotionHumanArmPlayed.written`), with the hand's digit goals removed so no digit is fitted after the plan, MoveIt's grasp convention (moveit_msgs/Grasp, BSD-3-Clause). Off its plan it returns the hand as it found it, which its reads there keep evaluated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trajectory solve per group/action, refused or not; each write reads its cubic or carry, with no carry solve at weights 0/1. An interior attitude still evaluates all three actual hand-end postures, but canonical observations can omit only proven independent goals/digits and FK outputs only the hand; the final held solve retains its physical work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates planning/carry/attitude to their owners. A synchronous write borrows its host FK/ROM loans for actual fallback carry and hand observations/held solve; standalone writes own lazy metadata. Only exact prerequisites share, while distinct posture/goal requests remain actual solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains props, its group's trajectory and existing follower. A standalone fixed-posture reader is built outside the write environment, so a retained follower cannot capture that write's metadata through its fallback callback. Hand demand and FK/ROM loans end on return/throw; no output or plan stores them or new time/result history.

# src/compose/AutoMovieMotionHumanArmCarry.ts#AutoMovieMotionHumanArmCarry.pace

## @evidence contracts/development/common.md#meaningful-documentation

States the combination and the default.

## @evidence contracts/development/implementation.md#principled-implementation

Arms planned as one problem share one speed bound; the fastest declared admits every member's own delivery.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one maximum per second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A group with no declared pace keeps the planner's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the group per second read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the carries.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the declaring carries only.
