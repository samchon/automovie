---
name: image
description: Generates the still images that carry how a production's people, places and props look, which its polygon men and coarse forms cannot show, namely canon reference images, style frames, a shot's first or last frame and turnaround views for modeling. Use when a settings or brief record, a video request or a 3D form needs a generated image.
---

# Image

A generated image carries what polygon men and coarse forms cannot: how a person, place or object looks. A video request takes it for identity and look, and a 3D model generates a form from it, while every shot's pose and camera come from the motion hint. One accepted image then travels through settings or brief records, video references and shot frames.

Most hosted image models expose no seed, so a prompt cannot reproduce an image: keep each accepted file and its record under [media records](../production/media-records.md#records), and reuse the file rather than regenerate it.

## Choose a generator

These are representative examples, not a complete or required list; read the chosen model's current documentation for sizes, input-image count, license and price, and record the choice in [project context](../production/project-context.md).

| Generator | Reached through | Note |
| --- | --- | --- |
| Codex built-in image generation | The `$imagegen` skill or a plain request, under the ChatGPT plan with no API key | It saves into Codex's own home directory, so copy each accepted image into the production; its edits work only on images visible in the conversation |
| A hosted image API, such as [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation) | A script with the user's key | |
| Open weights, such as the Stable Diffusion family with [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter), or an editing model that takes depth, edge and pose, such as [Qwen-Image-Edit](https://huggingface.co/Qwen/Qwen-Image-Edit-2509) | diffusers or ComfyUI | The route that conditions on a rendered form and repeats from a fixed seed |

## Canon references

Generate each subject's canon once, inspect it and freeze it. Generate every other view, shot frame and variant from the frozen canon, never from an earlier derived image, because each edit of an edit loses detail and drifts from the subject.

Video models cap references per subject at about three or four images and read each image as one view. Give each character separate images rather than one collage, on a plain background with flat light and the canonical wardrobe:

- a front full-body view in a neutral pose;
- a face close-up;
- three-quarter or profile views as the shots need.

A wardrobe, makeup or wound state of a story day is its own set. Give each set a plate without people in the shot's light, and each prop a plain-background view, out of any hand. Write each subject's description once and reuse it as the video prompt's [shared description](../video/prompts.md#shared-description), because the same words keep the same subject in both.

## Proportion guide

A prompt and the canon references are enough for most images, because the image only carries appearance. Render the subject's own form as a guide only when its build or shape departs from what the model draws by default, such as a child, a very tall person or an unusual object, and pass it loosely: a pose skeleton for a person, an outline or a weakened depth for an object, because depth or the render at full strength returns the coarse form's boxes and the polygon man's smooth surface.

Render a guide from the scene itself under [control channels](../motion/control-channels.md), because pose and depth estimators fail on featureless polygon men.

## Shot frames

A model that starts from a first frame takes the look from it while the hint gives the motion; when the two disagree on pose or camera, the result drifts.

Render the hint's first frame at the video model's exact output size and aspect, generate the frame from that structure and the canon identity, then [overlay](../visual-debugging/comparison.md#read-the-difference) it on the hint render and regenerate when silhouettes, horizon or facing move. Make a last frame the same way only when the shot's end pose matters, such as a matched cut.

## Turnaround views for modeling

Generated views carry no camera calibration or scale and disagree with each other at pixel level, so they serve as modeling references or image-to-3D input, never as measurements; real dimensions come from the research and the entity's code.

When the hint already has the form, render its own turnaround from fixed cameras and restyle each view with depth or normal control and the identity references, so the views agree by construction. They serve a commissioned [detail option](../development/entities.md#detail) as a form source under [3D modeling](../3d-modeling/SKILL.md); a coarse entity needs none.

## Inspect

Judge each image on its stills under [visual debugging](../visual-debugging/SKILL.md), against its record and its frozen canon: identity and wardrobe, hands, scale against a door or a figure, light direction, lettering, and the blur or oversharpened edges that repeated edits leave.

## Prompts

Follow the selected model's prompting guide, such as [OpenAI's](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide). Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role, such as "Image 1: identity of Mara; Image 2: style only", and keep style references apart from identity references. For an edit, state what changes and repeat what stays the same on every iteration.

Camera and lens words steer the look only loosely, so an exact camera comes from a reference or a control channel.
