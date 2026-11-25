# Method references

Check installed APIs before adopting an algorithm for [a law](SKILL.md), retargeting or conditioning.

Use these sources for implementation and failure checks. Derive movement targets from the [performance study](../../story/planning/research.md#performance-study). Verify the adopted method in the intended host and output.

## Reuse and transitions

[Motion Graphs](https://graphics.cs.wisc.edu/Papers/2002/KGP02/mograph.pdf), Sections 3–4, and [parameterized motions](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/ParamMotion/motionFamilies.pdf), Section 1.1.2, inform reusable transitions and bounded parameters for captured motion.

## Phase alignment and target fitting

[Animation sync markers](https://dev.epicgames.com/documentation/unreal-engine/animation-sync-groups-in-unreal-engine?application_version=5.8) and [target warping windows](https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-warping-in-unreal-engine) inform how to align meaningful phases and limit target adaptation to the relevant interval. Synchronization and target fitting do not establish collision response or balance.

## Effector goals

[Full Body IK](https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-full-body-ik-in-unreal-engine) and [Two Bone IK](https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.3/manual/constraints/TwoBoneIKConstraint.html) inform how to pose a body from effector goals with per-goal strength, a bend hint and per-joint limits, keeping the input pose where no goal pulls.

[Flash and Hogan](https://pubmed.ncbi.nlm.nih.gov/4020415/) studied unconstrained horizontal reaches. Use its minimum-jerk model with compatible endpoint conditions. [Putnam](https://pubmed.ncbi.nlm.nih.gov/8505347/) describes the sequencing and interaction of segments in fast actions. Use measurements of the depicted action for timing and contact speed.

## Prepared motion

[OpenUSD splines](https://openusd.org/dev/tut_xforms.html) illustrate time curves that represent changing speed without many linear samples. [Houdini constraints](https://www.sidefx.com/docs/houdini/character/kinefx/animatestateconstraints.html) illustrate linking controls for a defined range. These workflows support the [preparation and sampling design](transitions.md#pose-by-time).

[AutoKnots](https://arxiv.org/abs/2412.13423) places knots adaptively until an approximation meets its tolerance. [TOPP-RA](https://github.com/hungpham2511/toppra) times a path against velocity and acceleration limits. Brent's method (Brent 1973) locates a one-dimensional extremum without a sampling grid. Verify the implementation's contact error and solver scope on its own cases.

## Foot plants and ground

[Footskate Cleanup](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/Cleanup) constrains each plant and blends neighboring frames. Its slight leg stretch is unsuitable for a rigid rig.

[Semi-Procedural Locomotion](https://runevision.com/thesis/) adapts existing gait cycles to terrain with one heel-and-toe constraint.

## Spatial relations in contact

[Spatial Relationship Preserving Character Motion Adaptation](https://history.siggraph.org/?p=105435) preserves character and object contact through spatial relationships during motion edits.

[Spatiotemporal Retargeting](https://arxiv.org/abs/2610.30540) shows that object interaction depends on preserving body–object relations at critical stages and key body parts. Inspect those actual contacts instead of weighting every frame and part alike.

## Retargeting artifacts and contact claims

[Retargeting Matters / General Motion Retargeting](https://arxiv.org/abs/2510.02252) informs the retargeting check: inspect artifacts such as foot sliding, self-penetration and physically infeasible motion before expecting a downstream tracker or generator to repair them.

[Shooting for Contact](https://arxiv.org/abs/2608.03116) separates two claims, kinematic similarity and dynamically feasible contact. Use actual supported contact or physics evidence when the task requires it.

## Conditioning inputs

[Wan-Animate preprocessing](https://github.com/Wan-Video/Wan2.2/blob/main/wan/modules/animate/preprocess/UserGuider.md) informs what to inspect before generation: the actual pose and mask intermediate outputs, body-proportion retargeting and the selected mode's supported subject interactions.

[ControlNet](https://github.com/lllyasviel/ControlNet) shows that a conditioning mechanism has a concrete input contract. An arbitrary stick figure or depth-like image is not automatically a compatible signal.

## Procedure owners

[Retargeting](../retargeting.md), [physical feedback](../physical-feedback.md) and [frame evaluation](../frame-evaluation.md) own the production procedure, [control channels](../control-channels.md) the hint's channels, and [video generation](../../video/generation.md) service integration and take adoption.
