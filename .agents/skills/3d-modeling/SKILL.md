---
name: 3d-modeling
description: Defines how 3D assets are crafted in code, generated or found, conditioned for use, recovered into curves, rigged, and verified on screen. Use before changing geometry, rigs, assets, viewer behavior, materials, or lighting, and before claiming a visual change works; body motion belongs to the motion skill.
---

# 3D modeling

An asset is reproducible, rigged when it moves, and judged on screen. The project's own instructions set what each asset must show and control; read them before choosing a source. The user chooses whether to craft a form, generate it, or use an existing mesh.

| Task | Read |
| --- | --- |
| Building or changing a form from dimensions and formulas | [Crafting](crafting.md) |
| Building or fitting a form from related sections and guides | [Lofting](lofting.md) |
| Generating a form with a diffusion model | [Diffusion](diffusion.md) |
| Looking for an existing mesh, material, environment map or motion clip | [Sources](sources.md) |
| Taking a found or generated mesh into the project, or varying it by a parameter | [Conditioning](conditioning.md) |
| Rebuilding a fixed mesh as curves or surfaces, reconstructing saved coefficients, or judging a reverse render | [Recovery](recovery.md) |
| Defining parts, groups, placements or shared boundaries, whatever the asset's source | [Modularization](modularization.md) |
| Adding or changing a skeleton, skin, attachment or deformation control | [Rigging](rigging.md) |
| Planning a correction or judging any visual result | [Visual debugging](visual-debugging.md) |

Package documentation owns data formats and callable behavior. Completed generation, fitting, compilation or tests establish no visual result.
