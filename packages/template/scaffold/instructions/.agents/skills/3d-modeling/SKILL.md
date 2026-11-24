---
name: 3d-modeling
description: Prepares a subject's form and attachments.
---

# 3D modeling

Prepare each subject's form and attachments from its production record.

## Default form

Use [entity work](../development/entities.md#coarse-first) for people and provided objects. A needed subject without a provided model takes a coarse form, and a subject the hint does not need stays a description in the generation prompt.

| Read | To |
| --- | --- |
| [Environments](environments.md) | Build a place: a furnished room, a terrain or an outdoor set |
| [Coarse forms](coarse-forms.md) | Build a subject no package provides from a few primitives |
| [Modularization](modularization.md) | Define parts, groups, placements or shared boundaries |
| [Inspecting a form](inspection.md) | Inspect a form's measures, coverage or light |

Commissioned detail uses modularization and form inspection too.

A coarse form that reads poorly gets a better choice of primitives, never finer geometry.

## Commissioned detail

For a commissioned [detail option](../development/entities.md#detail), use the source the user chooses and cover the required views and controls.

| Read | To |
| --- | --- |
| [Diffusion](diffusion/SKILL.md) | Generate the form with a diffusion model |
| [Crafting](crafting/SKILL.md) | Shape it in code from dimensions and formulas |
| [Lofting](crafting/lofting.md) | Build or fit it from sections and guides |
| [Sources](sources.md) | Find an existing mesh, material, environment map or motion clip |
| [Conditioning](conditioning.md) | Take a found or generated mesh into the production, or vary it by a parameter |
| [Mesh recovery](crafting/recovery.md) | Rebuild a fixed mesh as curves or surfaces |
| [Rigging](rigging.md) | Add or change a skeleton, skin, attachment or deformation control |

Give a detailed surface without a sourced image a `procedural` surface on its material. It generates wood, stone, plaster, clay, fabric or brushed metal from a seed, a feature size in metres, two linear colours, two roughness values and a relief in metres. Set `axis` along the grain, warp or brushing direction for wood, fabric and brushed metal. On a laid surface pattern, set `piece` from the occurrence's sheet kind, tile and texture transform: a `face` sheet runs on across joints and `module` pieces differ like separately made tiles.

Give a used object `wear` on its material: an `edge` layer for paint chipped off convex edges and a `grime` layer for dirt in concave creases, each with a colour, a roughness, a band width in metres and an amount. Wear follows the mesh's sharp edges at bind pose, so it needs no extra vertices and stays put on a skinned mesh. Darkening where separate objects touch comes from the film's occlusion, not from wear.
