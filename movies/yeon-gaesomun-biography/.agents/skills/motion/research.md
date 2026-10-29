# Motion and conditioning references

These sources inform candidate methods and failure checks. Their reported experiments, embodiments and hardware do not validate this production or supply an installed solver. Adopting a principle below for film is a production inference, to be checked through the current host and commissioned output.

| Primary source | Decision informed here |
| --- | --- |
| [Retargeting Matters / General Motion Retargeting](https://arxiv.org/abs/2510.02252) | Source-to-target artifacts such as sliding, self-intersection and velocity spikes deserve inspection before expecting a downstream tracker or generator to repair them |
| [Shooting for Contact](https://arxiv.org/abs/2608.03116) | Kinematic similarity and dynamically feasible contact are different claims; use actual supported contact/physics evidence when the task requires it |
| [Spatiotemporal Retargeting](https://arxiv.org/abs/2610.30540) | Object-interaction fidelity can depend on particular stages and body parts; inspect those actual contacts instead of relying on a uniform average pose error. Treat this recent research as a candidate method, not an established AutoMovie capability |
| [Wan-Animate preprocessing](https://github.com/Wan-Video/Wan2.2/blob/main/wan/modules/animate/preprocess/UserGuider.md) | Inspect the actual pose/mask intermediate outputs, body-proportion retargeting and the selected mode's supported subject interactions before generation |
| [ControlNet](https://github.com/lllyasviel/ControlNet) | A conditioning mechanism has a concrete input contract; an arbitrary stick figure or depth-like image is not automatically a compatible signal |

[Retargeting](retargeting.md), [physical feedback](physics.md) and [frame evaluation](timeline.md) own the production procedure. [Video generation](../production/generation.md) owns service integration and take adoption. Preserve sources and contacts through conversion and inspect actual outputs; promising research does not justify live generation inside deterministic replay.
