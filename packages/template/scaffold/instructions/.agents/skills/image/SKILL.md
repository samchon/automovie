---
name: image
description: Generates the still images that carry the appearance of a production's people, places and props, which its polygon men and coarse forms cannot show, namely canon references, a shot's first frame, last frame or keyframes and turnaround views for modeling. Use when a settings or brief record, a video request or a 3D form needs a generated image.
---

# Image

A generated image carries what polygon men and coarse forms cannot: the appearance of a person, place or object. A video request takes it for identity and appearance, and, for a requested detail option, an image-to-3D model generates a form from it, while every shot's pose and camera come from the motion hint. One accepted image then travels through settings or brief records, video references and shot frames.

Many hosted image models expose no seed or do not honor one exactly, so a prompt cannot reproduce an image: keep each accepted file and its record under [media records](../production/media-records.md#records), and reuse the file rather than regenerate it.

## Choose a generator

These are representative examples, not a complete or required list; read the chosen model's current documentation for sizes, input-image count, license and price, and record the choice in [project context](../production/project-context.md).

| Generator | Reached through | Note |
| --- | --- | --- |
| Codex built-in image generation | The `$imagegen` skill or a plain request, under the ChatGPT plan with no API key | It saves into Codex's own home directory, so copy each accepted image into the production; its edits work only on images visible in the conversation, so view a saved file before editing it |
| A hosted image API, such as [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) or [Google Gemini image generation](https://aistudio.google.com/docs/image-generation) | A script with the user's key | |
| Open weights, such as the Stable Diffusion family with [ControlNet](https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet) and [IP-Adapter](https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter), or an editing model that takes depth, edge and pose, such as [Qwen-Image-Edit](https://huggingface.co/Qwen/Qwen-Image-Edit-2509) | diffusers or ComfyUI | The route that conditions on a rendered form and repeats from a fixed seed |

## Canon references

For a generated film, choose the video model under [video](../video/SKILL.md) first, because its guide and terms decide the views. Generate each subject's canon references once, inspect them and freeze them. Generate every other view, shot frame and variant from the frozen canon references, never from an earlier derived image, because each edit of an edit loses detail and drifts from the subject. A take's frame that continues the next request is a video input under [requests](../video/requests.md#inputs), not a derived image.

On a short, a subject only one scene shows has its canon references embedded in that scene file's standing state; a user's fixed screenplay is never edited, so its one-scene canon references go with the instructions.

Video models cap references per subject at about three or four images, and some read a multi-view sheet as several subjects. Give each character separate images rather than one collage, on a plain background with flat light and the canonical wardrobe:

- a front full-body view in a neutral pose;
- a face close-up with a neutral expression;
- three-quarter or profile views as the shots need, unless the model's guide asks for fewer, as one that wants only a headshot and a full-body image does.

Where the chosen model's terms reject references with real human faces, ask the user how to give it identity.

A wardrobe, makeup or wound state of a story day is its own reference set, generated from the base canon references and then frozen as that state's canon references. Give each place a plate without people in the shot's light, and each prop a plain-background view. Prompt each subject's images with its record's wording and, where a generated film has one, the film's medium or rendering style from its [project context](../production/project-context.md) entry, the words the [shared description](../video/prompts.md#shared-description) also uses, because the same words keep the same subject in both.

## Control images

For a canon reference, a plate or any other image without the hint's structure, a prompt is enough, with the canon references once they exist, because such an image carries only appearance. Add a control image only when a subject's build or shape departs from what the model draws by default, such as a child, a very tall person or an unusual object: render it from the subject's entity in a neutral pose and pass it loosely, to a proprietary model as an input labeled for build only and to an open model as [dense passes](../motion/control-channels.md#dense-passes) sets.

## Shot frames

A model that starts from a first frame takes the appearance from it while the hint gives the motion; when the two disagree on pose or camera, the result drifts.

Render the first frame of the request's rendered hint, handles included, at the video model's exact output size and aspect. Prompt the image with the [shared description](../video/prompts.md#shared-description), the film's look included, where a generated film has one, and give the hint's frame with the canon references to a proprietary model as an input labeled "pose and camera reference only" and to an open model as the control images [dense passes](../motion/control-channels.md#dense-passes) sets. Then [overlay](../visual-debugging/comparison.md#read-the-difference) the generated frame on the hint's frame and regenerate when silhouettes, horizon or facing move.

When the image model's sizes differ from the video model's, render the hint's frame at a size the image model takes, with the video frame inside it, and crop the result to the video frame.

Make a last frame, or a keyframe at another frame the model takes, the same way from the hint's frame there, where the shot must keep a pose: a matched cut, an outcome a still-frame model must keep, or a subject that enters after the first frame.

## Turnaround views for modeling

Generated views carry no camera calibration or scale and disagree with each other at pixel level, so they serve as modeling references or image-to-3D input, never as measurements; real dimensions come from the research and the entity's code.

When the hint already has the form, pose it as the image-to-3D [request](../3d-modeling/diffusion.md#request) sets for the chosen model, such as an A-pose with the limbs apart for a form that will deform, render its own turnaround from fixed cameras at one framing and light, and restyle each view with the canon references as [shot frames](#shot-frames) restyle the hint's frame; then check that the views agree before use. They serve a commissioned [detail option](../development/entities.md#detail) as a form source under [3D modeling](../3d-modeling/SKILL.md); a coarse entity needs none.

## Inspect

Judge each image under [visual debugging](../visual-debugging/SKILL.md), against its record and its frozen canon references: identity and wardrobe, hands, scale against a door or a figure, light direction, lettering, and the blur or oversharpened edges that repeated edits leave.

## Prompts

Follow the selected model's prompting guide, such as [OpenAI's](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide). Describe scene, subject, key details and constraints in that order and state the image's use.

Label each input image by index and role, such as "Image 1: identity of Mara; Image 2: the kitchen plate". For an edit, state what changes and repeat what stays the same.

Camera and lens words steer the image only loosely, so an exact camera comes from a reference or a control image.
