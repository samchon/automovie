---
name: video-diffusion
description: Chooses the video generation model with the user and reads its documentation for every value the plan depends on, with representative models by how each takes a motion hint. Use when choosing or changing the video model.
---

# Video diffusion

Choose the model with the user and record it in [project context](../../production/project-context.md).

## Read the model

Read the chosen model's current documentation for its input and output lengths, frame rate and frame grid, sizes, the controls and references it accepts with their roles, the settings or wording that set how closely it follows its input, how a request continues a previous take, prompt length, negative prompt, seed, and sound with the languages its speech takes. The model decides which controls are used, and this step is the one place its input contract is verified. When a page cannot be read, ask the user for the values the plan depends on rather than assume them.

When the model's output size or frame rate differs from the [delivery profile](../../production/project-context.md), ask the user whether to change the profile or to upscale or retime the takes.

## Models

These are representative examples, not a complete or required list; any model the user prefers or a newer release can serve. Each page records how one model takes a motion hint, how a request sets its [adherence](../requests.md#adherence), and how it continues a take, as its documentation stated them; the documentation owns the values.

| Model | Takes the hint as | Page |
| --- | --- | --- |
| Runway Aleph 2.0 | A video to edit or restyle | [Runway Aleph](runway-aleph.md) |
| Kling 4.0 Omni | A video to edit, or videos as references | [Kling Omni](kling-omni.md) |
| Kling Motion Control 3.0 | One figure's body motion | [Kling Motion Control](kling-motion-control.md) |
| Seedance 2.5 | A video to edit or extend, or reference videos | [Seedance](seedance.md) |
| MiniMax-H3 | Reference videos with roles | [MiniMax-H3](minimax-h3.md) |
| fal H3 Max 3D to video | A gray layout it turns into the shot | [fal H3 Max](fal-h3-max.md) |
| Gemini Omni Flash | A video to edit, or short reference videos | [Gemini Omni](gemini-omni.md) |
| Veo 3.1 | Still frames only | [Veo](veo.md) |
| Luma Ray 3.2 | A video to edit, with keyframes | [Luma Ray](luma-ray.md) |
| LTX | The RGB hint, or one control pass | [LTX](ltx.md) |
| Wan VACE and Fun Control | Control passes | [Wan](wan.md) |

Proprietary models take the hint as RGB video at most and derive any structure from it themselves. Open models with control adapters take depth, edge or pose videos directly, so choose one when exact positions, contacts and camera outweigh its setup cost.

When adding a model, give it a page in the same form.

Read each model's terms before adopting it: territory limits, rejected reference content such as real human faces, revenue thresholds and labeling duties for open weights, and price per second.