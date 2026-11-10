---
name: image
description: Generates still images for a production, such as canon reference images of cast, sets and props, a shot's first or last frame, style frames and turnaround views for modelling. Use when a settings or brief record, a video request or a 3D form needs a generated image.
---

# Image

A generated image fixes what words cannot, how a figure, place or object looks, and one accepted image then travels through settings or brief records, video references and shot frames. Most hosted image models expose no seed, so a prompt cannot reproduce an image: keep each accepted file and its record under [media](../production/media.md#records), and reuse the file rather than regenerate it.

## Choose a generator

These are representative examples, not a complete or required list; read the chosen model's current documentation for sizes, input-image count, licence and price.

- In Codex, the built-in image generation (the `$imagegen` skill or a plain request) uses OpenAI GPT Image under the ChatGPT plan, without an API key. It saves into Codex's own home directory, so copy each accepted image into the production, and its edits work only on images visible in the conversation.
- Other agents call an image API through a script with the user's key, such as [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation).
- The Stable Diffusion family and its open successors, such as [SDXL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) with [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter) in diffusers or ComfyUI, are the route that conditions on the hint's geometry exactly and repeats from a fixed seed.

## Decide how much the hint controls

Prompting alone suffices when no camera or pose has to match: canon sheets, set plates, style frames and early exploration. Use the hint when the image must agree with it, as for a shot's first or last frame, figures whose eyelines, contact or depth order matter, a specific pose, a held prop or a screen direction that must survive a cut, or when a control-conditioned video model will follow the hint. In rising cost and precision:

1. A prompt with canon references.
2. The hint render as an extra input labelled "pose and camera reference only", which hosted models follow loosely.
3. Control channels rendered from the hint, such as depth, normal, pose skeleton and outline, through ControlNet with identity from IP-Adapter or a LoRA.

Render control channels from the hint scene itself, under [control channels](../motion/conditioning.md), because pose and depth estimators fail on featureless stand-ins. When the cast's build differs from the stand-in, weight pose above depth, since depth imprints the stand-in's silhouette.

## Canon references

Video models cap references per subject at about three or four images and read each image as one view, so give each character separate images rather than one collage: a front full-body view in a neutral pose, a face close-up, and three-quarter or profile views as the shots need, on a plain background with flat light and the canonical wardrobe. A wardrobe change is its own set. Give each set a plate without people in the shot's light, and each prop a plain-background view. Reuse the same files and the same description wording wherever the subject appears.

## Shot frames

A first frame gives an image-to-video model the look while the hint gives the motion; when the two disagree on pose or camera, the result drifts. Render the hint's first frame at the video model's exact output size and aspect, generate the frame from that structure and the canon identity, then overlay it on the hint render and regenerate when silhouettes, horizon or eyelines move. Make a last frame the same way only when the shot's end pose matters, such as a matched cut.

## Turnaround views for modelling

Generated views carry no camera calibration or scale and disagree with each other at pixel level, so they serve as modelling references or image-to-3D input, never as measurements; real dimensions come from the research and the entity's code. When the hint already has the form, render its own turnaround from fixed cameras and restyle each view with depth or normal control and the identity references, so the views agree by construction. They serve a commissioned [detail option](../development/entities.md#detail) as a form source under [3D modeling](../3d-modeling/SKILL.md); a coarse entity needs none.

## Prompts

Follow the selected model's prompting guide, such as [OpenAI's](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide). Describe scene, subject, key details and constraints in that order and state the image's use. Label each input image by index and role, such as "Image 1: identity of Mara; Image 2: pose and camera reference only". For an edit, state what changes and repeat what stays the same on every iteration. Camera and lens words steer the look only loosely, so an exact camera comes from a reference or a control channel.
