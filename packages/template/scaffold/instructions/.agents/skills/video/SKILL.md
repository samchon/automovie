---
name: video
description: Turns a production's motion hint into generated video, choosing the model with the user, planning each scene's requests and how closely each follows the hint, writing their prompts, submitting, inspecting and adopting takes, and finishing them for assembly. Use before generating video from a motion hint, when choosing or changing a video model, when planning or writing a video generation request, when adopting or rejecting a take, and when finishing accepted takes.
---

# Video

A video model turns the motion hint into finished picture and, when it can, sound. Video is generated only when the commission calls for it; a motion hint or a direct 3D film never silently requires a generator. Generate takes only from a hint that passed [segment review](../motion/segment-review.md) and a screenplay whose review has closed, or one no narrative pass reviews, because a repair to either discards the takes made from it.

What the model accepts decides how the hint is prepared, and its limits on length, frame rate, references and prompt size decide how scenes become requests, so choose the model before planning requests or writing prompts:

1. Choose the model with the user and read its documentation under [video diffusion](diffusion/SKILL.md).
2. Write the [shared description](diffusion/prompts.md#shared-description), then prepare the canon references under [image](../image/SKILL.md).
3. Plan each scene's [requests](requests.md): where each ends, how closely it follows the hint, and what it takes.
4. Prepare any shot frame each request takes under image.
5. Write each request's prompt under [prompts](diffusion/prompts.md), with the sound decided under [audio](../audio/SKILL.md).
6. Submit, inspect and adopt takes under [generation](generation.md).
7. Repair, upscale, conform and match the accepted takes under [finishing](finishing.md).
