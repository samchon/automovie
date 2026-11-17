---
name: 3d-modeling
description: Prepares a subject's form and attachments. Use for coarse models, rigs or commissioned detail; motion and picture judgment have their own skills.
---

# 3D modeling

Prepare each subject's form and attachments from its production record.

## Default form

Use [entity work](../development/entities.md#coarse-first) for people and provided objects. A needed subject without a provided model takes a [coarse form](coarse-forms.md).

A subject the hint does not need stays a description in the generation prompt. Inspect each modeled form beside its neighbors at its use scale under [form inspection](inspection.md).

## Requested detail

Use a [detail option](../development/entities.md#detail) when commissioned, such as for a [direct 3D film](../video/direct-film.md), or when primitives cannot make the form identifiable.

The user chooses a generated, crafted or existing mesh. Build the detail its requested views and controls need.

## Methods

Read the method for the chosen representation or operation:

| Task | Read |
| --- | --- |
| Generate the form with a diffusion model | [Diffusion](diffusion/SKILL.md) |
| Shape it in code from dimensions and formulas | [Crafting](crafting/SKILL.md) |
| Build or fit it from sections and guides | [Lofting](crafting/lofting.md) |
| Find an existing mesh, material, environment map or motion clip | [Sources](sources.md) |
| Take a found or generated mesh into the production, or vary it by a parameter | [Conditioning](conditioning.md) |
| Rebuild a fixed mesh as curves or surfaces | [Mesh recovery](crafting/recovery.md) |
| Define parts, groups, placements or shared boundaries | [Modularization](modularization.md) |
| Add or change a skeleton, skin, attachment or deformation control | [Rigging](rigging.md) |
| Inspect a form's measures, coverage, construction or light | [Inspecting a form](inspection.md) |
