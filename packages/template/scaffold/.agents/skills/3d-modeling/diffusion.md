# Diffusion

A diffusion model's image or mesh is source material, not an asset: its output is not reproducible, its topology follows no deformation, it carries no rig, and its texture bakes in the light it was generated under. Rebuild it into an asset the engine owns. This covers generated forms; repainting rendered frames into video is a separate lane.

## Source

1. Use the model or service the user chooses, local or paid.
2. Save the generated file with the model, version, seed, prompt, and inputs that produced it. The saved file, not the prompt, is the reproducible source.
3. Treat multi-view images and single-image meshes as approximate: views of one generation disagree, and hidden sides are invented.

## Placement Or Rebuild

Place a generated mesh as it is only when it never deforms, never comes close to the camera, and never varies by parameter, and even then retopologize it to the budget and delight its texture. Rebuild everything else.

## Rebuild

1. Normalize the source to the engine's unit, frame, and rest pose, and segment it into the parts the asset will have.
2. Extract in reverse what the authored form needs: sections, silhouettes from matching views, feature curves, and landmarks.
3. Re-author the form by [Authoring](authoring.md), fitting its named parameters to those extracts, so only fitted coefficients enter the asset, never the generated vertices.
4. Where the form resists a parametric description, retopologize it into quads whose loops follow deformation, unwrap it, and carry its fine detail as normal or displacement maps over the rebuilt surface.
5. Delight the texture, removing baked shading and shadows, split it into the material channels the renderer uses, and make it continuous across seams.
6. Bind a moving asset to the engine's shared skeleton, using an automatic rigger's skeleton and weights only as a first guess, and verify the weights at the extremes of the supported range of motion.

## Verification

Compare the rebuilt asset with its source from matching views and scale, then verify it by [Visual Debugging](visual-debugging.md), deformation at the range-of-motion extremes included. The source's own errors, such as invented hidden sides or melted thin parts, are not targets to fit.
