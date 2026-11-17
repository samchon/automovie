---
name: image-diffusion
description: Chooses image generators, writes prompts, conditions images on renders and references, preserves subjects, edits images and finishes accepted results. Use when generating or editing an image with an external model, or choosing its model and input method.
---

# Image diffusion

Generate and edit the images [image work](../SKILL.md) needs. The input method determines how references and rendered structure reach the model; accepted images follow [every image](../SKILL.md#every-image).

| Task | Read |
| --- | --- |
| Compare generators and compatible controls | [Models](models.md) |
| Write an image prompt | [Prompting](prompting.md) |
| Hold an image to a render's pose, camera or shape | [Conditioning](conditioning.md) |
| Keep a subject consistent across images | [Consistency](consistency.md) |
| Change part of an accepted image | [Editing](editing.md) |
| Upscale an image or give it transparency | [Finishing](finishing.md) |

## Model documentation

Choose the model with the user and record it in [project context](../../production/project-context.md). Check the exact checkpoint and endpoint's input roles, reference limits, masks, controls, output size and alpha support before planning requests.

Its current documentation owns prompt syntax, rewriting and grounding, seed behavior, usage terms and price. A hosted endpoint and downloadable weights can expose different controls and licenses.
