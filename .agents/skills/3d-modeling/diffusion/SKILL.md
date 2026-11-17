---
name: 3d-modeling-diffusion
description: Generates a mesh with a text- or image-to-3D model.
---

# Diffusion

A diffusion model turns a prompt, images or a shape into a mesh. Steer it with the strongest input the project has, because each weaker one leaves more for the model to invent:

| Read | For |
| --- | --- |
| [Shape hints](shape-hints.md) | A shape to keep, such as a coarse form, a crafted form or a body |
| [Image hints](image-hints.md) | An image of the subject, or views of it |
| [Text prompts](prompts.md) | Only a description |

Use the model the user chooses, local or hosted; [3D models](models.md) shows current examples, [request](request.md) sets what to ask for, and [Conditioning](../conditioning.md) takes the result into the project.

Repainting rendered frames into video is a separate task. A generated 2D image is an appearance reference and supplies no geometry until an image-to-3D model turns it into a mesh.
