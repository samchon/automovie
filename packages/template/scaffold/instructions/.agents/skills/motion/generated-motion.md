# Generated and captured motion

Motion models generate a body's motion from text, music or keyframes, or capture it from footage. A person's performance is still [composed](compose/SKILL.md) from the installed vocabulary, so such motion serves only these uses:

| Use | Technique | Holds |
| --- | --- | --- |
| Measuring a practice for its [study](../story/planning/research.md#performance-study) | Capture from footage of qualified practitioners | Timing, ranges and paths, estimated rather than measured |
| A clip the commission supplies or the user chooses | Any technique, then [retargeting](retargeting.md) | Whatever the clip holds, after cleanup |
| A target a production law is tuned against | Text-to-motion, or trajectory or keyframe control | A plausible shape only; never a study's evidence |

A generated clip is never the study of a practice, because it repeats its training data's average rather than the depicted level.

## Techniques

- **Text-to-motion** generates a few seconds of one body from a description, often as joint positions on an SMPL-family skeleton at 20 to 30 fps. Examples: [MoMask](https://github.com/EricGuo5513/momask-codes), [HY-Motion](https://github.com/Tencent-Hunyuan/HY-Motion-1.0), [Kimodo](https://huggingface.co/nvidia/Kimodo-SOMA-SEED-v1).
- **Controlled generation** follows joint trajectories, keyframes, paths or music. Its constraints are soft unless an optimization step enforces them afterwards. Examples: [OmniControl](https://github.com/neu-vi/OmniControl), [EDGE](https://github.com/Stanford-TML/EDGE).
- **Capture from footage** estimates a body and its world path from video, assuming a static camera or estimating its motion. Performers who cross or occlude each other break it. Examples: [WHAM](https://github.com/yohanshin/WHAM), [GVHMR](https://github.com/zju3dv/GVHMR).
- **Physics tracking** replays a clip through a simulated body to remove floating, sliding and penetration. Examples: [PHC](https://github.com/ZhengyiLuo/PHC), [ProtoMotions](https://github.com/NVlabs/ProtoMotions).

## What a clip lacks

- **Contacts.** Expect foot sliding, penetration, jitter and floating; clean plants and contacts before use, as [retargeting](retargeting.md#preserve-contacts-and-time) checks them.
- **Objects and partners.** These models generate one body without the object or partner it touches, so a contact between two clips is never shared. Stage an exchange through a mutual join or an object's affordance instead.
- **Rotations.** Many models output joint positions only, and any body parameters come from a later fit to a neutral shape, so convert positions to rotations by a stated fit rather than relabeling them, and treat the fit as derived.
- **Reproducibility.** A seed does not repeat a clip across library versions or machines, and hosted outputs expire. Freeze the bytes at once, and record the prompt, model, version and seed as provenance only.

## Licenses

A clip's rights come in layers, and each must allow the use: the code, the weights, the body model, the training data, the territory and the plan. The SMPL and SMPL-X body models and the AMASS data forbid commercial use without a separate license, though most code built on them is MIT. Several capture models are research-only, and some open weights exclude whole regions.

Sources: [SMPL license](https://smpl.is.tue.mpg.de/modellicense.html), [AMASS license](https://amass.is.tue.mpg.de/license.html), [HumanML3D](https://github.com/EricGuo5513/HumanML3D), [Kimodo constraints](https://research.nvidia.com/labs/sil/projects/kimodo/docs/key_concepts/constraints.html), [PhysDiff](https://arxiv.org/abs/2212.02500), [PyTorch reproducibility](https://docs.pytorch.org/docs/2.15/notes/randomness.html).
