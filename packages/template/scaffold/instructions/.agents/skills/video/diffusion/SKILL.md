---
name: video-diffusion
description: Chooses the video generation model with the user, reads its documentation for every value the plan depends on, chooses how the hint reaches it, keeps requests continuous, and writes the prompts it takes. Use when choosing or changing the video model, deciding how a request takes the hint or continues a take, or writing a video prompt.
---

# Video diffusion

How a production drives the video model it chose with the user and recorded in [project context](../../production/project-context.md).

| Read | To |
| --- | --- |
| [Video models](models.md) | Compare current models and how each takes the hint |
| [Hints](hints.md) | Choose how the hint reaches the model |
| [Continuity](continuity.md) | Continue a take across requests and keep the film consistent |
| [Prompts](prompts.md) | Write a request's prompt |

## Model documentation

Before planning requests, read the chosen model's current documentation for every value the plan depends on: input and output lengths, frame rate and frame grid, sizes, the controls and references it accepts with their roles, the settings or wording that set how closely it follows its input, how a request continues a previous take, prompt length, negative prompt, seed, and sound with the languages its speech takes. When a page cannot be read, ask the user for the values rather than assume them.

When the model's output size or frame rate differs from the [delivery profile](../../production/project-context.md), ask the user whether to change the profile or to [upscale or conform](../finishing.md) the takes, and by which method, and record the answer in project context.
