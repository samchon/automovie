---
name: image-diffusion
description: Chooses the image generator and writes image prompts, with a page per representative generator. Use when choosing an image generator or writing an image prompt; image owns what each image is for.
---

# Image diffusion

## Choose a generator

These are representative examples, not a complete or required list. Read the chosen generator's current documentation for sizes, input-image count, license and price, and record the choice in [project context](../../production/project-context.md).

| Generator | Reached through | Page |
| --- | --- | --- |
| Codex built-in image generation | Codex, under the ChatGPT plan with no API key | [Codex image generation](codex-imagegen.md) |
| OpenAI GPT Image | A script with the user's key | [GPT Image](gpt-image.md) |
| Google Gemini image generation | A script with the user's key | [Gemini image](gemini-image.md) |
| Open weights with control adapters | diffusers or ComfyUI | [Open weights](open-weights.md) |

Hosted generators take a rendered frame only as an image to follow. An open model conditions on the rendered form through a control adapter and repeats from a fixed seed, so choose one when a shot frame must hold the hint's pose and camera exactly.

When adding a generator, give it a page in the same form.

## Prompts

Follow the selected generator's prompting guide. Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role in the prompt, never as text in the image, such as "Image 1: identity of Mara; Image 2: the kitchen plate". For an edit, state what changes and repeat what stays the same.

Camera and lens words steer the image only loosely, so an exact camera comes from a reference or a control image.
