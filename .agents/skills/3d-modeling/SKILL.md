---
name: 3d-modeling
description: Defines how 3D assets are crafted from formulas, recovered from fixed sources, or placed from generated meshes, how they are rigged, and how visual changes are verified. Use before changing geometry, rigs, assets, viewer behavior, materials, or lighting, and before claiming a visual change works; body motion belongs to the motion skill.
---

# 3D modeling

An asset is reproducible, rigged when it moves, and judged on screen. The project's own instructions set what each asset must show and control; read them before choosing a source. The user chooses whether to craft a form, recover it from fixed source geometry, or place an eligible generated or existing mesh.

| Task | Read |
| --- | --- |
| Building or changing a form from dimensions and formulas | [Crafting](crafting.md) |
| Building or fitting a form from related sections and guides | [Lofting](lofting.md) |
| Extracting curves or surfaces from a fixed mesh, reconstructing saved coefficients, or judging a reverse render | [Recovery](recovery.md) |
| Using a diffusion model's image or mesh as the source of a form | [Diffusion](diffusion.md) |
| Defining parts, groups, placements or shared boundaries, whatever the asset's source | [Modularization](modularization.md) |
| Adding or changing a skeleton, skin, attachment or deformation control | [Rigging](rigging.md) |
| Looking for an existing mesh, material, environment map or motion clip to use or recover | [Sources](sources.md) |
| Selecting external geometry or rig acquisition | [Research](research.md) |
| Planning a correction or judging any visual result | [Visual debugging](visual-debugging.md) |

Package documentation owns data formats and callable behavior. Completed generation, fitting, compilation or tests establish no visual result.
