---
name: 3d-modeling-diffusion
description: Generates a mesh with a text- or image-to-3D model, steered by a prompt, an image or a shape the project already has. Use when a form is generated rather than crafted or found.
---

# Diffusion

A diffusion model turns a prompt, images or a shape into a mesh. Give it the strongest hint the project has, because each weaker one leaves more for the model to invent:

| The project has | Read |
| --- | --- |
| A shape to keep, such as a proxy, a crafted form or a body | [Shape hints](shape-hints.md) |
| An image of the subject, or views of it | [Image hints](image-hints.md) |
| Only a description | [Text prompts](prompts.md) |

Whatever the hint, [request](request.md) sets what to ask for, [3D models](models.md) shows current examples, and [Conditioning](../conditioning.md) takes the result into the project.

Repainting rendered frames into video is a separate lane. A generated 2D image serves as appearance reference and supplies no geometry until an image-to-geometry model turns it into a mesh.
