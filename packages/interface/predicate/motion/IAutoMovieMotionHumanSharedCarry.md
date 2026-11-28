# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage

## @evidence contracts/development/common.md#meaningful-documentation

The input names two independent grounded roles, one rigid carton, finite starting and receiving faces, and the common carry course.

## @evidence contracts/development/design.md#principled-representation

A rigid course and two actual material grips share the same authored prop. Both starting and receiving footprints are checked in their placed support frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One paired stock recipe composes existing pickup, rigid-arm preparation and ordinary following chains.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole

## @evidence contracts/development/common.md#meaningful-documentation

One performer waits, closes one hand on its named round rail, and releases after the supported settlement.

## @evidence contracts/development/design.md#principled-representation

The role names its body and hand, one material handle and two independent timing choices. No shared pose data is lifted from a nominal grip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the role-specific wait and scheduled release are added to the named material pickup.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageSupport

## @evidence contracts/development/common.md#meaningful-documentation

The finite named face belongs to a fixed scene prop. The carton rests on the face at its chosen endpoint.

## @evidence contracts/development/design.md#principled-representation

The receiving material is identified by scene subject and affordance, so both its frame and finite footprint come from the prop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One fixed subject and its face are enough to establish the resting contact.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageCourse

## @evidence contracts/development/common.md#meaningful-documentation

Duration is in seconds, lift in metres, and the destination is a full world-space rigid transform.

## @evidence contracts/development/design.md#principled-representation

A single authored rigid course controls both hands. The starting prop frame and checked destination define translation and rotation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The course declares only interval, rise and the terminal frame. The existing fitted-arm planner owns the posture tracks.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStaged

## @evidence contracts/development/common.md#meaningful-documentation

The result contains the already prepared episode, its registered law, and two independently extendable role chains.

## @evidence contracts/development/design.md#principled-representation

The prop episode and role laws share the same evaluated clocks. Each returned chain retains the ordinary public continuation surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result supplies exactly the episode, law and role chains needed for a normal performance.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode

## @evidence contracts/development/common.md#meaningful-documentation

The record carries the exact first closure, settlement and last release instants, a world-frame reader, and both checked role intervals.

## @evidence contracts/development/design.md#principled-representation

The frame is evaluated independently of the participants so their hands may follow the same material without a read cycle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One bounded registration covers the two grip roles and the settled frame. Outside it the performance uses ordinary custody.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole

## @evidence contracts/development/common.md#meaningful-documentation

The interval identifies a real performer, hand, rail and placed anchor. Its endpoints are closure and release on the film clock.

## @evidence contracts/development/design.md#principled-representation

The role identifies both the nominal site and the action's played contact clock. Placement matches each against the declared grip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only one actor, hand, material id and interval are stored per role.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.id

## @evidence contracts/development/common.md#meaningful-documentation

The episode id supplies the registered law name and both unique role anchors.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.seed

## @evidence contracts/development/common.md#meaningful-documentation

The same authored seed drives the ordinary preparatory pickups.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.prop

## @evidence contracts/development/common.md#meaningful-documentation

The carried prop supplies the rigid box and two real round handle colliders.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.carriers

## @evidence contracts/development/common.md#meaningful-documentation

Two independent role inputs appear in the returned chain order.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.start

## @evidence contracts/development/common.md#meaningful-documentation

The named fixed face contains the four bottom corners at the starting frame.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.end

## @evidence contracts/development/common.md#meaningful-documentation

The named fixed face contains the four bottom corners at settlement.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStage.course

## @evidence contracts/development/common.md#meaningful-documentation

The chosen course lasts until the shared prop settles on the receiving face.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole.performer

## @evidence contracts/development/common.md#meaningful-documentation

The stored body, placement, heading and proficiency drive this role's pickup.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole.hand

## @evidence contracts/development/common.md#meaningful-documentation

The named hand closes on its rail and opens at that role's release.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole.handle

## @evidence contracts/development/common.md#meaningful-documentation

The id selects one round rail and its material collider.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole.wait

## @evidence contracts/development/common.md#meaningful-documentation

The optional wait uses film seconds before the pickup and defaults to zero.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageRole.releaseAfter

## @evidence contracts/development/common.md#meaningful-documentation

The optional hold lasts this many seconds after settlement. Unequal values permit a one-handed interval.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageSupport.prop

## @evidence contracts/development/common.md#meaningful-documentation

The same support model is present in the final performance under its scene subject.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageSupport.point

## @evidence contracts/development/common.md#meaningful-documentation

The affordance provides a material plane with its finite outline.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageCourse.duration

## @evidence contracts/development/common.md#meaningful-documentation

The closed interval begins at the later grip and may last at most five seconds.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageCourse.rise

## @evidence contracts/development/common.md#meaningful-documentation

The centre rises this distance in metres over the line between its endpoints.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStageCourse.to

## @evidence contracts/development/common.md#meaningful-documentation

The destination gives the exact world position and attitude of the resting prop.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStaged.episode

## @evidence contracts/development/common.md#meaningful-documentation

The prepared record is installed in the performance's shared carry list.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStaged.law

## @evidence contracts/development/common.md#meaningful-documentation

The registered law evaluates both prepared role clips.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IStaged.chains

## @evidence contracts/development/common.md#meaningful-documentation

The first and second role chains preserve input order and may accept normal continuation actions.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.prop

## @evidence contracts/development/common.md#meaningful-documentation

The scene subject identifies the original rigid prop.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.from

## @evidence contracts/development/common.md#meaningful-documentation

The first played grip defines the start of shared custody.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.settled

## @evidence contracts/development/common.md#meaningful-documentation

The prop has reached the supported material frame by this film second.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.to

## @evidence contracts/development/common.md#meaningful-documentation

The last role release ends the authored shared span.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.frame

## @evidence contracts/development/common.md#meaningful-documentation

The pure reader gives the checked world frame at requested film seconds.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedEpisode.roles

## @evidence contracts/development/common.md#meaningful-documentation

The two role records bind both live hand contacts to the same prop.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.subject

## @evidence contracts/development/common.md#meaningful-documentation

The subject identifies the performer expected to execute the prepared grip.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.hand

## @evidence contracts/development/common.md#meaningful-documentation

The side identifies the actual posed hand at the chosen rail.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.handle

## @evidence contracts/development/common.md#meaningful-documentation

The role names the prop-local material site it holds.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.anchor

## @evidence contracts/development/common.md#meaningful-documentation

The anchor owns the role's played grip and release events.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.from

## @evidence contracts/development/common.md#meaningful-documentation

The grip begins at this film second.

# src/motion/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPreparedRole.to

## @evidence contracts/development/common.md#meaningful-documentation

The opened hand stops holding at this film second.
