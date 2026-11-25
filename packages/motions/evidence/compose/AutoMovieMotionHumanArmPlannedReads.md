# src/compose/AutoMovieMotionHumanArmPlannedReads.ts#AutoMovieMotionHumanArmPlannedReads

## @evidence contracts/development/common.md#meaningful-documentation

States each reading, what it reads and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

Each instant's base is the posture so far with the planned arms left out; a base within a frame and a half of the one resolved last continues its limbs' fits from that base's seeds, the frame-to-frame coherence an animation system's IK keeps (Aristidou et al. 2018, section 7; Tolani, Goswami and Badler 2000, section 3.2.4). Each planned hand's fingers are one joint-space state fitted with the arm at its goal's own fit, MoveIt's grasp convention (moveit_msgs/Grasp, BSD-3-Clause).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plan's readings, moved verbatim from `AutoMovieMotionHumanArmPlanned.planned`, read the scope the plan hands them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every reading is an actual solve at its exact instant; only completed fits publish.

## @evidence contracts/development/implementation.md#efficient-algorithms

Postures, removed-arm bases, their finger states, perceived goals and endpoint fits are computed once per exact instant within their own plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same body, cached raw posture and goal and endpoint second prove fit equivalence within this synchronous plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns the posture, base, finger and fit maps and the last resolved seeds until it returns or throws; the returned trajectories keep only the finger states.

# src/compose/AutoMovieMotionHumanArmPlannedReads.ts#AutoMovieMotionHumanArmPlannedReads.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the plan holds.

## @evidence contracts/development/design.md#principled-representation

The plan's own arguments and borrowed readers, named, so the readings read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, each read by a reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the plan's values as they are; nothing is copied or derived.

# src/compose/AutoMovieMotionHumanArmPlannedReads.ts#AutoMovieMotionHumanArmPlannedReads.IReads

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its inputs, units and result.

## @evidence contracts/development/design.md#principled-representation

The plan's own readers and the maps the solve reads completed instants from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ten members, each read by the plan, its problem or its solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reading serves one law or a test.
