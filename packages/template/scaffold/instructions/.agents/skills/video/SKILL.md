---
name: video
description: Chooses the video generation model for a production, plans each shot's requests within that model's limits, writes its prompts, and submits, inspects and adopts the generated takes. Use before generating video from a motion hint, when choosing or changing a video model, when writing a video generation prompt, and when adopting or rejecting a take.
---

# Video

Use this only when the commission calls for generated video; a motion hint or a direct 3D film never silently requires a generator. A video model turns the motion hint into finished picture and, when it can, sound. What it accepts decides how the hint is prepared: some models edit or restyle the hint video, some read it only as a reference for motion and camera, open models can follow pose or depth passes exactly, and others accept only still frames. Its limits on length, frame rate, references and prompt size decide how scenes become requests, so the model is chosen before scenes are split into requests or prompts written.

1. Choose the model, and how it takes the hint, with the user from [models](models.md), and record the choice in [project context](../production/profile.md).
2. Read the chosen model's current documentation for every value the plan depends on: input and output lengths, frame rate and frame grid, sizes, the controls and references it accepts with their roles, prompt length, negative prompt, seed and sound. The model decides which controls are used, and this step is the one place its input contract is verified.
3. Split each scene into requests within those limits, and render each request's hint and control channels at the model's frame rate, frame grid and size under [control channels](../motion/conditioning.md). When a model works in segments, give each segment the previous segment's accepted last frames as its reference input so motion continues across the seam, and the canon references with them, because identity and colour drift with every segment chained from generated frames.
4. Prepare canon references and shot frames under [image](../image/SKILL.md).
5. Write each request's prompt under [prompts](prompts.md), with the sound decided under [audio](../audio/SKILL.md).
6. Submit, inspect and adopt takes under [generation](generation.md).
