---
name: image-diffusion
description: Chooses the image generator and writes image prompts. Use when choosing an image generator or writing an image prompt; image owns what each image is for.
---

# Image diffusion

## Choose a generator

Choose the generator with the user from [image generators](models.md) or another they prefer, read its current documentation, and record the choice in [project context](../../production/project-context.md).

Hosted generators take a rendered frame only as an image to follow. An open model conditions on the rendered form through a control adapter and repeats from a fixed seed, so choose one when a shot frame must hold the hint's pose and camera exactly.

## Prompts

Follow the selected generator's prompting guide. Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role in the prompt, never as text in the image, such as "Image 1: identity of Mara; Image 2: the kitchen plate". For an edit, state what changes and repeat what stays the same.

Camera and lens words steer the image only loosely, so an exact camera comes from a reference or a control image.
