---
name: video-diffusion
description: Chooses the video generation model with the user, reads its documentation for every value the plan depends on, chooses how the hint reaches it, keeps requests continuous, and writes the prompts it takes. Use when choosing or changing the video model, deciding how a request takes the hint or continues a take, or writing a video prompt.
---

# Video diffusion

Choose the model with the user and record it in [project context](../../production/project-context.md); [video models](models.md) shows, by current examples, how differently models take the hint, set adherence and continue a take. Then choose how the hint reaches it under [hints](hints.md), keep requests continuous under [continuity](continuity.md), and write each request's prompt under [prompts](prompts.md), following the model's own guide.

## Read the model

Read the chosen model's current documentation for its input and output lengths, frame rate and frame grid, sizes, the controls and references it accepts with their roles, the settings or wording that set how closely it follows its input, how a request continues a previous take, prompt length, negative prompt, seed, and sound with the languages its speech takes. The model decides which controls are used, and this step is the one place its input contract is verified. When a page cannot be read, ask the user for the values the plan depends on rather than assume them.

When the model's output size or frame rate differs from the [delivery profile](../../production/project-context.md), ask the user whether to change the profile or to [upscale or conform](../finishing.md) the takes, and by which method, and record the answer in project context.
