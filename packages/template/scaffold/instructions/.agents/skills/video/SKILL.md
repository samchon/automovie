---
name: video
description: Turns a production's motion hint into generated video, choosing the model with the user, planning each scene's requests and how closely each follows the hint, writing their prompts, submitting, inspecting and adopting takes, and finishing them for assembly. Use before generating video from a motion hint, when choosing or changing a video model, when planning or writing a video generation request, when adopting or rejecting a take, and when finishing accepted takes.
---

# Video

A video model turns the motion hint into finished picture and, when it can, sound. Generate video only when the commission calls for it; a motion hint or a direct 3D film never silently requires a generator. Generate takes only from a hint that passed [segment review](../motion/segment-review.md) and a screenplay whose review has closed, or that no narrative pass reviews, because a repair to either discards the takes made from it.

The model's inputs decide how the hint is prepared, and its limits on length, frame rate, references and prompt size decide how scenes become requests, so video work runs in this order:

1. Choose the model with the user and read its documentation under [video diffusion](diffusion/SKILL.md).
2. Write the [shared description](diffusion/prompts.md#shared-description).
3. Prepare the canon references under [image](../image/SKILL.md).
4. Plan each scene's [requests](requests.md).
5. Prepare any shot frame a request takes under [image](../image/conditioning.md#shot-frames).
6. Decide each request's sound under [audio](../audio/generated-sound.md).
7. Write each request's [prompt](diffusion/prompts.md).
8. Submit, inspect and adopt takes under [generation](generation.md).
9. Repair, upscale, conform and match the accepted takes under [finishing](finishing.md).
