# Generated film

A video model turns the motion hint into finished picture and, when it can, sound. The hint supplies the performance; image references and prompts supply the look.

## Prerequisites

Use a hint that passed [segment review](../motion/segment-review.md). Close any [required screenplay review](../story/workflow/routes.md#completion) before generating takes.

## Steps

The model's accepted inputs and output limits determine how scenes become requests, so generation runs in this order:

1. Choose the model with the user and read its documentation under [video diffusion](diffusion/SKILL.md).
2. Write the [shared description](diffusion/prompts.md#shared-description).
3. Prepare the canon references under [image](../image/SKILL.md).
4. Plan each scene's [requests](requests.md).
5. Prepare any shot frame a request takes under [image](../image/diffusion/conditioning.md#shot-frames).
6. Decide each request's sound under [audio](../audio/generated-sound.md).
7. Write each request's [prompt](diffusion/prompts.md).
8. Submit, inspect and adopt takes under [generation](generation.md).
9. Repair, upscale, conform and match the accepted takes under [finishing](finishing.md).
