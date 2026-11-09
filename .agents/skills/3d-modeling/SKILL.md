---
name: 3d-modeling
description: Defines how 3D assets are crafted from formulas, recovered from fixed sources, or placed from generated meshes, how they are rigged, and how visual changes are verified. Use before changing geometry, rigs, assets, viewer behavior, materials, lighting, or motion, and before claiming a visual change works.
---

# 3D Modeling

An asset is reproducible, rigged when it moves, and judged on screen. The project's own instructions set what each asset must show and control; read them before choosing a source. The user chooses whether to craft a form, recover it from fixed source geometry, or place an eligible generated or existing mesh:

- Read [Crafting](crafting.md) when building or changing a form from dimensions and formulas.
- Read [Lofting](lofting.md) when building or fitting a form from related sections and guides.
- Read [Recovery](recovery.md) before extracting curves or surfaces from a fixed mesh, reconstructing saved coefficients, or judging a reverse render.
- Read [Diffusion](diffusion.md) when a diffusion model's image or mesh is the source of a form.
- Read [Modularization](modularization.md) when defining parts, groups, placements, or shared boundaries, whatever the asset's source.
- Read [Rigging](rigging.md) when an asset needs a new or changed skeleton, skin, attachment or deformation control.
- Read [Sources](sources.md) when looking for an existing mesh, material, environment map or motion clip to use or recover.
- Read [Research](research.md) when selecting external geometry or rig acquisition.
- Read [Visual Debugging](visual-debugging.md) before planning a correction or judging any visual result.

Package documentation owns data formats and callable behavior. Completed generation, fitting, compilation or tests establish no visual result.
