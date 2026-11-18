---
name: 3d-modeling-diffusion
description: Generates a commissioned detail option's form with a text- or image-to-3D model.
---

# Diffusion

Generate only a commissioned [detail option](../../development/entities.md#detail). Use the coarse form for dimensions and parts and canon references for appearance:

| Read | When the subject has |
| --- | --- |
| [Geometry condition](shape-hints.md#geometry-condition) | A coarse form whose layout the detail must keep |
| [Texture on the given mesh](shape-hints.md#texture-on-the-given-mesh) | A crafted form that is already final |
| [Bodies](shape-hints.md#bodies) | A polygon man, for a detailed person |
| [Rendered views](shape-hints.md#views-rendered-from-the-shape) | Canon references, and no model that takes a shape |
| [Text prompts](prompts.md) | Only its record |

Condition geometry on the [coarse form](../coarse-forms.md) and appearance on canon references. Texture a final crafted form from those references. For bodies, condition on the polygon man's joints and bind to the same skeleton.

The views are rendered from the coarse form and restyled under [turnaround views](../../image/turnaround-views.md), and [image hints](image-hints.md) covers those images. A text prompt keeps the record's wording.

Choose the model with the user, from [3D models](models.md) or beyond, and record it in [project context](../../production/project-context.md); [request](request.md) sets what to ask for, whatever steers it.

Freeze each accepted result and take it into the entity's detail option under [Conditioning](../conditioning.md), keep it where [media records](../../production/media-records.md#files) sets, and compare it with the coarse form as [detail](../../development/entities.md#detail) sets.
