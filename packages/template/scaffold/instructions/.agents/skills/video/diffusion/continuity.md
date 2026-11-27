# Continuity

Every request is a separate generation, so identity, light, color and motion can jump wherever two requests meet.

## Chaining requests

<!-- @reference The [VACE user guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md) describes extension from selected frames. -->

Where the model takes multiple videos with roles, pass the accepted take's ending as a continuation input and count it toward the input limit. Otherwise start from a chain frame.

Choose a chain frame before end-of-take drift. Record it and state the pose and state at the seam. Use the model's lossless or high-bit-depth format when available.

If extension takes only prior frames, place it under [placement in time](../generation.md#placement-in-time). If continuation cannot use the hint, end at a cut. Report overlong continuous shots to the user for model choice.

## Across the film

Use the identical canon references and [shared description](prompts.md#shared-description) in every request. See [media records](../../production/media-records.md) for seed limits.

Bind recurring character references as elements where supported. Check photorealism restrictions. A compatible [checkpoint](models.md#layout-and-structural-control) may use a [LoRA](../../image/diffusion/consistency.md#character-lora) trained on accepted frames. Preserve voice under [generated sound](../../audio/generated-sound.md).

## Seams

Check every seam on the consecutive frames of both takes under [comparison](../../visual-debugging/comparison.md). Repair a failed seam by regenerating its time range under [partial repair](../finishing.md#partial-repair) before regenerating either whole request.
