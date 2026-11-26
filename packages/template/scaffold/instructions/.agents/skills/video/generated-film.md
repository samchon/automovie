# Generated film

Generate the finished picture and any supported sound. Take performance from the motion hint and appearance from references and prompts.

## Model and inputs

Choose the [video model](diffusion/SKILL.md) with the user and record it in [project context](../production/project-context.md) before preparing model-dependent references, shot frames or channels. Follow the model's input roles and limits.

## Prerequisites

Before submission, clear [segment review](../motion/segment-review.md) for the hint and close any [required screenplay review](../story/workflow/routes.md#completion).

## Steps

The model's accepted inputs and output limits determine how scenes become requests, so generation runs in this order:

1. Write the [shared description](diffusion/prompts.md#shared-description).
2. Prepare the [canon references](../image/canon-references.md) the model takes.
3. Plan each scene's [requests](requests.md).
4. Prepare any required [shot frames](../image/diffusion/conditioning.md#shot-frames) and control channels.
5. If the commission includes sound, decide each request's sound under [audio](../audio/generated-sound.md).
6. Write each request's [prompt](diffusion/prompts.md).
7. [Submit requests](generation.md#submission) and [review takes](generation.md#inspection-and-choice) before adoption.
8. Repair, upscale, conform and match the accepted takes under [finishing](finishing.md).
9. Composite clean renders under [compositing](finishing.md#compositing).
