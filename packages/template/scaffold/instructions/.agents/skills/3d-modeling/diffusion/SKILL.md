---
name: 3d-modeling-diffusion
description: Generates the form of a commissioned detail option with a text- or image-to-3D model, steered first by the subject's own coarse form and canon references. Use when the user chooses a generated form for a detail option.
---

# Diffusion

A generated form serves only a commissioned [detail option](../../development/entities.md#detail); the coarse form stays the default and the hint every scene uses. Steer the model from what the production has already decided, because the coarse form holds the subject's size and parts and the canon references hold its look:

| The subject has | Hint | Read |
| --- | --- | --- |
| A [coarse form](../coarse-forms.md) whose layout the detail must keep | The coarse form as a geometry condition, with a canon reference for the look | [Geometry condition](shape-hints.md#geometry-condition) |
| A crafted form that is already final | Texture on that form from the canon references | [Texture on the given mesh](shape-hints.md#texture-on-the-given-mesh) |
| A polygon man, for a detailed person | A pose condition from its joints, then a bind onto the same skeleton, so the motion planned for it still fits | [Bodies](shape-hints.md#bodies) |
| Canon references, and no model that takes a shape | Views rendered from the coarse form and restyled under [turnaround views](../../image/SKILL.md#turnaround-views-for-modeling) | [Image hints](image-hints.md) |
| Only its record | A text prompt in the record's wording | [Text prompts](prompts.md) |

Whatever the hint, [request](request.md) sets what to ask for and [3D models](models.md) shows current examples. Keep each accepted result under [media records](../../production/media-records.md#files), take it into the entity's detail option under [Conditioning](../conditioning.md), and check that it keeps the coarse form's size, pivots and contacts.
