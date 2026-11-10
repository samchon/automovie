---
name: 3d-modeling
description: Defines the form each subject of a production takes, namely the polygon man for a person, a coarse form of a few primitives for anything else, and on the user's request a generated, crafted or recovered form with its rig. Use before building or changing a subject's form and before claiming a visual change works; body motion belongs to the motion skill.
---

# 3D modeling

A production's film is a hint for video diffusion, which supplies the look, so each subject takes the least form that serves the hint. Read [project context](../production/project-context.md) first for the representation the production adopted.

## Default form

A subject the hint does not need takes no form and stays a description in the generation prompt. A person is the polygon man that [entity work](../development/entities.md#people) prepares. Anything else a scene shows or touches is a [coarse form](coarse-forms.md), a few primitives that are just enough to tell what it is.

## Requested detail {#requested-detail}

Go further only when the user asks for it, as a [detail option](../development/entities.md#detail), or when primitives cannot make a form identifiable. The user chooses its source: a diffusion model's output, code that shapes it in detail, or an existing mesh.

Build only what the request names and the subject's visible role needs. Finer geometry than that takes the time motion needed, and diffusion repaints it anyway.

| Task | Read |
| --- | --- |
| Generate the form with a diffusion model | [Diffusion](diffusion.md) |
| Shape it in code from dimensions and formulas | [Crafting](crafting.md) |
| Build or fit it from sections and guides | [Lofting](lofting.md) |
| Find an existing mesh, material, environment map or motion clip | [Sources](sources.md) |
| Recover curves or surfaces from a fixed mesh | [Recovery](recovery.md) |
| Define parts, groups, placements or shared boundaries | [Modularization](modularization.md) |
| Add or change a skeleton, skin, attachment or deformation control | [Rigging](rigging.md) |
| Choose an external geometry or rig method | [Research](research.md) |
| Plan a correction or judge a visual result | [Visual debugging](visual-debugging.md) |

Whatever its source, a form is reproducible, rigged when it moves and judged on screen: a completed generation, fit, compilation or test establishes no visual result. The installed packages' documentation owns data formats and callable behavior.
