# Method references

These primary sources help choose the algorithm of a law written under [vocabulary extension](extension.md), and inform the retargeting and control-channel checks. The installed motion vocabulary has already made these choices for its own actions, and the installed engine may already provide a method, so read its README before adopting one.

The sources inform implementation methods and failure checks only; movement evidence comes from the [performance study](../../story/planning/research.md#performance-study). Their experiments, embodiments and hardware neither validate this production nor supply an installed solver, so check an adopted principle on the current host and the commissioned output.

## Reuse and transitions

[Motion Graphs](https://graphics.cs.wisc.edu/Papers/2002/KGP02/mograph.pdf), Sections 3–4, and [parameterized motions](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/ParamMotion/motionFamilies.pdf), Section 1.1.2, inform how to reuse motion units: through compatible transitions and meaningful bounded parameters. These captured-motion methods inform composition without supplying a procedural controller or contact solver.

## Phase alignment and target fitting

[Animation sync markers](https://dev.epicgames.com/documentation/unreal-engine/animation-sync-groups-in-unreal-engine?application_version=5.8) and [target warping windows](https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-warping-in-unreal-engine) inform how to align meaningful phases and limit target adaptation to the relevant interval. Synchronization and target fitting do not establish collision response or balance.

## Effector goals

[Full Body IK](https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-full-body-ik-in-unreal-engine) and [Two Bone IK](https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.3/manual/constraints/TwoBoneIKConstraint.html) inform how to pose a body from effector goals with per-goal strength, a bend hint and per-joint limits, keeping the input pose where no goal pulls.

## Foot plants and ground

[Footskate Cleanup](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/Cleanup) holds each foot plant exactly and blends the correction into neighboring frames, because plants switching on and off pop the knee and root. The method cleans existing motion and may stretch legs slightly, which a rigid rig does not allow.

[Semi-Procedural Locomotion](https://runevision.com/thesis/) adapts example gait cycles so each foot lands on the actual ground, with heel and toe aligned as one constraint. Built for keyframed or captured cycles, it informs a law for a gait no installed package carries, such as that of an animal no archetype offers.

## Spatial relations in contact

[Spatial Relationship Preserving Character Motion Adaptation](https://history.siggraph.org/?p=105435) shows that close contact between characters or with objects, such as wrestling, dancing or entering a car, survives editing when their spatial relations are kept rather than their joint angles. It says what to preserve, not how to solve it here.

[Spatiotemporal Retargeting](https://arxiv.org/abs/2610.30540) shows that object interaction depends on preserving body–object relations at critical stages and key body parts. Inspect those actual contacts instead of weighting every frame and part alike.

## Retargeting artifacts and contact claims

[Retargeting Matters / General Motion Retargeting](https://arxiv.org/abs/2510.02252) informs the retargeting check: inspect artifacts such as foot sliding, self-penetration and physically infeasible motion before expecting a downstream tracker or generator to repair them.

[Shooting for Contact](https://arxiv.org/abs/2608.03116) separates two claims, kinematic similarity and dynamically feasible contact. Use actual supported contact or physics evidence when the task requires it.

## Conditioning inputs

[Wan-Animate preprocessing](https://github.com/Wan-Video/Wan2.2/blob/main/wan/modules/animate/preprocess/UserGuider.md) informs what to inspect before generation: the actual pose and mask intermediate outputs, body-proportion retargeting and the selected mode's supported subject interactions.

[ControlNet](https://github.com/lllyasviel/ControlNet) shows that a conditioning mechanism has a concrete input contract. An arbitrary stick figure or depth-like image is not automatically a compatible signal.

## Procedure owners

[Retargeting](../retargeting.md), [physical feedback](../physical-feedback.md) and [frame evaluation](../frame-evaluation.md) own the production procedure, [control channels](../control-channels.md) the hint's channels, and [video generation](../../video/generation.md) service integration and take adoption.
