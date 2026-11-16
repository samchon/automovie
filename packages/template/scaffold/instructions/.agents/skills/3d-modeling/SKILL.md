---
name: 3d-modeling
description: Defines the form each subject of a production takes, namely the polygon man for a person, an installed archetype for an object people use, a coarse form of a few primitives for anything else, and on the user's request a generated, crafted or recovered form with its rig. Use before building or changing a subject's form; judging any picture belongs to the visual-debugging skill and body motion to the motion skill.
---

# 3D modeling

3D modeling gives each subject its form: the coarse default every scene uses and, on request, a detailed one. Read [project context](../production/project-context.md) first for the representation the production adopted.

## Default form

Each subject takes the least form its motion hint needs, as [coarse first](../development/entities.md#coarse-first) sets:

- no form for a subject the hint does not need, which stays a description in the generation prompt;
- the polygon man for a [person](../development/entities.md#people);
- an [installed archetype](../development/entities.md#objects), where one offers it, for an object a person holds, uses, sits on or rides;
- a [coarse form](coarse-forms.md) for anything else a scene shows or touches.

## Requested detail

Go further only for a [detail option](../development/entities.md#detail), such as a [direct 3D film](../direct-film/SKILL.md)'s, or when primitives cannot make a form identifiable. The user chooses its source: a diffusion model's output, code that shapes it in detail, or an existing mesh. Build only what the request names and the subject's visible role needs, because finer geometry takes the time motion needs and diffusion repaints it anyway.

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

Whatever its source, a form is reproducible, rigged when it moves, and judged on screen under [visual debugging](../visual-debugging/SKILL.md), because a completed generation, fit, compilation or test establishes no visual result. The installed packages' documentation owns data formats and callable behavior.
