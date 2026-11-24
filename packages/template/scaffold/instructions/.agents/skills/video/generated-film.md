# Generated film

A video model turns the motion hint into finished picture and, when it can, sound. The hint supplies the performance; image references and prompts supply the look.

## Model and inputs

Choose the model with the user under [video diffusion](diffusion/SKILL.md) and record it in [project context](../production/project-context.md) before preparing model-dependent references, shot frames or control channels. Use its documented input roles and limits.

## Prerequisites

Before submitting requests, use a hint that passed [segment review](../motion/segment-review.md). Close any [required screenplay review](../story/workflow/routes.md#completion).

## Steps

The model's accepted inputs and output limits determine how scenes become requests, so generation runs in this order:

1. Write the [shared description](diffusion/prompts.md#shared-description).
2. Prepare the [canon references](../image/canon-references.md) the model takes.
3. Plan each scene's [requests](requests.md).
4. Prepare any required [shot frames](../image/diffusion/conditioning.md#shot-frames) and control channels.
5. If the commission includes sound, decide each request's sound under [audio](../audio/generated-sound.md).
6. Write each request's [prompt](diffusion/prompts.md).
7. With the prerequisites met, submit, inspect and adopt takes under [generation](generation.md).
8. Repair, upscale, conform and match the accepted takes under [finishing](finishing.md).
9. Composite clean renders under [compositing](finishing.md#compositing).
