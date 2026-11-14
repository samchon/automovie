---
name: video-diffusion
description: Chooses the video generation model with the user, reads its documentation for every value the plan depends on, and writes the prompts it takes. Use when choosing or changing the video model or writing a video prompt.
---

# Video diffusion

Choose the model with the user and record it in [project context](../../production/project-context.md). Write each request's prompt under [prompts](prompts.md), following the model's own guide.

## Read the model

Read the chosen model's current documentation for its input and output lengths, frame rate and frame grid, sizes, the controls and references it accepts with their roles, the settings or wording that set how closely it follows its input, how a request continues a previous take, prompt length, negative prompt, seed, and sound with the languages its speech takes. The model decides which controls are used, and this step is the one place its input contract is verified. When a page cannot be read, ask the user for the values the plan depends on rather than assume them.

When the model's output size or frame rate differs from the [delivery profile](../../production/project-context.md), ask the user whether to change the profile or to upscale or retime the takes.

## Models

[Video models](models.md) shows, by current examples, how differently models take the hint, set adherence and continue a take.
