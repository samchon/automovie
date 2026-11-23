# src/motion/human/body/IAutoMovieMotionHumanBody.ts#IAutoMovieMotionHumanBody

## @evidence contracts/development/common.md#meaningful-documentation

measure: The anthropometric measure, metres and kilograms. topology: The rig's topology, shared by every fit. rest: Rest joint positions, canonical metres.

## @evidence contracts/development/design.md#principled-representation

measure: The anthropometric measure, metres and kilograms. topology: The rig's topology, shared by every fit. rest: Rest joint positions, canonical metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jumpAirborne.ts (jumpAirborne.knee, body); actions/jumpLanding.ts (jumpLanding.of, body); actions/jumpTakeoff.ts (jumpTakeoff, body); actions/runStance.ts (runStance.plan, body); actions/stand.ts (stand.relaxed, body); actions/stand.ts (stand.abduction, body).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieSkeleton, IAutoMoviePhysicalProfile, IAutoMovieBodyMeasure, IAutoMovieHumanoidSurfaces.ISurfaces, IAutoMovieSkeletonTopology identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
