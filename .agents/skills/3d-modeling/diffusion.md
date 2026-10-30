# Diffusion

A diffusion model's image or mesh is source material; turn it into a reproducible authored asset.

This covers generated forms; repainting rendered frames into video is a separate lane.

Apply [Modularization](modularization.md) to direct placement and rebuilds alike.

## Source

1. Use the model or service the user chooses, local or paid.
2. Save the generated file with the model, version, seed, prompt, and inputs that produced it. The saved file, not the prompt, is the reproducible source.
3. Treat the source as approximate: views of one generation disagree, and hidden sides are invented.

## Placement Or Rebuild

Use a fixed generated mesh directly when its admitted geometry, materials, rig and controls meet the actual views, motion and variation within budget. Inspect the imported result at that use, including deformation and close views when required; source quality or a successful import cannot establish fitness. Correct baked lighting or conversion defects where they affect the result.

Recover or rebuild when the required editing, parameter control, deformation or internalization cannot be supplied by that asset and its supported controls. Proximity to the camera or motion alone does not require reconstruction; imposing it can discard usable rigging without improving the commissioned performance. Keep the user's chosen source workflow within these observed limits.

## Rebuild

1. Normalize the source to the engine's unit, frame, and rest pose, and segment it into the asset's parts.
2. For a fixed mesh, follow [Recovery](recovery.md) to extract and reconstruct its numerical shape. Image-only sources need a separate image-to-geometry method before mesh recovery applies.
3. When the asset must vary, derive the shared dimensions and formulas under [Crafting](crafting.md); recovered source coefficients alone do not establish parameter behavior.
4. Remove the baked lighting from its texture and split it into the renderer's material channels.
5. Rig a moving asset on the engine's skeleton for its kind, treating any generated rig or weights as a first guess.

## Verification

Compare the rebuilt asset with its source from matching views, then verify it by [Visual Debugging](visual-debugging.md). The source's own errors, such as invented hidden sides or melted thin parts, are not targets to fit.
