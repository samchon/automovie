---
name: image-diffusion
description: Chooses the image generator and writes image prompts. Use when choosing an image generator or writing an image prompt; image owns what each image is for.
---

# Image diffusion

Image diffusion chooses the generator and writes the prompt for each image the [image](../SKILL.md) skill defines.

## Generator choice
Choose the generator with the user from [image generators](models.md) or another they prefer, read its current documentation, and record the choice in [project context](../../production/project-context.md).

Most hosted generators take a rendered frame only as an image to follow, and a few hosted endpoints condition on its depth or edges. An open model conditions on the rendered form through a control adapter and repeats from a fixed seed, so choose a conditioned route when a shot frame must hold the hint's pose and camera exactly.

## Prompts

Follow the selected generator's prompting guide. Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role in the prompt, such as "Image 1: identity of Mara; Image 2: the kitchen plate", never as text in the image. Generators take the output's size from different inputs, some from the first and some from the last, so set the size explicitly or put the render where the generator reads it. Turn off any prompt rewriting the generator offers, as the [shared description](../../video/diffusion/prompts.md#shared-description) sets.

For an edit, state what changes and repeat what stays the same. Where everything else must stay identical, composite the approved change back over the original instead of accepting the whole regenerated image.

Camera and lens words steer the image only loosely, so an exact camera comes from a reference or a control image.
