---
name: 3d-modeling-diffusion
description: Generates a mesh with a text- or image-to-3D model, namely what to request, what comes back and which models exist. Use when a form is generated rather than crafted or found.
---

# Diffusion

A diffusion model turns a prompt or images into a mesh. This guide covers what to ask of it and which models exist, [prompts and inputs](prompts.md) how to write the request, and [Conditioning](../conditioning.md) how the result enters the project.

Repainting rendered frames into video is a separate lane. A generated 2D image serves as appearance reference and supplies no geometry until an image-to-geometry model turns it into a mesh.

## Request

Generating again with a better request costs less than repairing a mesh, so ask for whichever of these the model offers, through its settings rather than prompt words:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation, alone on a plain background in an input image | Several subjects fused into one surface |
| A rest pose with the arms and legs apart, an A-pose or a T-pose, for a body that will deform | Limbs fused to the body or to each other, and a failed automatic rig |
| Part-aware generation or segmentation, or each part generated alone, for parts that move | Moving parts fused into one surface |
| The triangle count [Conditioning](../conditioning.md#reduce) would reduce to | Far more triangles than any view needs |
| Separate material channels and a base color with the light removed | Light and shadow baked into the texture |
| Several views of the subject, in the views and order the model names, front first | Invented hidden sides |
| A real-world size and an origin at the base | An arbitrary scale and origin |

No request removes the rest: a size that is only the model's estimate, an arbitrary facing, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

## Models

Use the model or service the user chooses, local or hosted. These are representative examples, not a complete or required list. Each page records a model's input, what it gives beyond the mesh, and its terms, as its documentation stated them; the documentation owns the values.

| Model | Runs as | Input | Page |
| --- | --- | --- | --- |
| Meshy | Hosted API | Text, one image or up to four | [Meshy](meshy.md) |
| Tripo | Hosted API | Text, one image or keyed views | [Tripo](tripo.md) |
| Rodin | Hosted API | Text, or up to five images | [Rodin](rodin.md) |
| Hunyuan3D-2.1 | Open weights | One image | [Hunyuan3D](hunyuan3d.md) |
| TRELLIS.2 | Open weights | One image | [TRELLIS.2](trellis.md) |

A model that takes one image gains nothing from a turnaround; one that takes views reads them in its own order, front first.

When adding a model, give it a page in the same form.

Read each model's terms before adopting it: plan requirements, the output's license, and territory.