---
name: image
description: Generates the still images that carry the appearance of a production's people, places and props, which its polygon men and coarse forms cannot show, namely canon references, a shot's first frame, last frame or keyframes and turnaround views for modeling. Use when a settings or brief record, a video request or a 3D form needs a generated image.
---

# Image

A generated image carries what polygon men and coarse forms cannot: the appearance of a person, place or object. A video request takes it for identity and appearance while the motion hint gives every shot's pose and camera; an image-to-3D model can also build a requested detail option from it. One accepted image then travels through settings or brief records, video references and shot frames.

Many hosted image models expose no seed or do not honor one exactly, so a prompt cannot reproduce an image. Keep each accepted file as generated, with its content credentials, and its record under [media records](../production/media-records.md#records), and reuse it rather than regenerate it.

Choose the generator and write each image prompt under [image diffusion](diffusion/SKILL.md).

## Canon references

For a generated film, choose the video model under [video](../video/SKILL.md) first, because its guide and terms decide the views. Generate each subject's canon references once, inspect them, have the user accept them and freeze them. Generate every other view, shot frame and variant from the frozen canon references, never from an earlier derived image, because each edit of an edit loses detail and drifts from the subject.

A wardrobe, makeup or wound state of a story day is its own reference set, generated from the base canon references and then frozen as that state's canon references.

Give each subject the number and form of references the video model's guide sets, within its size and aspect limits. Many models cap images per request rather than per subject, so make only the views the shots' subjects need. Where the guide sets none, give each character separate images, one person in each, on a plain background with flat light and the canonical wardrobe:

- a front full-body view in a neutral pose;
- a face close-up with a neutral expression;
- three-quarter or profile views as the shots need.

Where the chosen model's terms reject references with real human faces or minors, ask the user how to give it identity, and record the answer in [project context](../production/project-context.md).

Give each prop a plain-background view, and each place one canon plate without people for each light state its scenes use, such as day and night.

Prompt each subject's images with its record's wording and, for a generated film, the film's medium or rendering style, because the [shared description](../video/diffusion/prompts.md#shared-description) of its video prompts uses the same words, and the same words keep the same subject in both. Name each garment and its color every time, because references carry a face more surely than clothes.

## Control images

A canon reference or a plate needs only a prompt, because it carries only appearance. Add a control image only when a subject's build or shape departs from what the model draws by default, such as a child or an unusual object: render it from the subject's entity in a neutral pose and pass it loosely, as [dense passes](../motion/control-channels.md#dense-passes) sets.

## Shot frames

A model that starts from a first frame takes the appearance from it while the hint gives the motion; when the two disagree on pose or camera, the result drifts.

Render the first frame of the request's hint at the video model's exact output size and aspect, cropping when the image model's sizes differ, and crop the canon references given beside it to the same aspect, because a reference's aspect can override the frame's.

Generate the shot frame from that render and the canon references, prompted as canon references are: give the render to a hosted model as an input labeled "pose and camera reference only", and to an open model as the control images [dense passes](../motion/control-channels.md#dense-passes) sets. Then [overlay](../visual-debugging/comparison.md#read-the-difference) the generated frame on the render and regenerate when silhouettes, horizon or facing move. Upscale a frame only in a mode that keeps detail rather than inventing it, and overlay it again.

Make a last frame or a keyframe the same way, from the hint's frame there, where the model takes one and the shot needs it: a matched cut, an outcome a still-frame model must keep, or a subject that enters after the first frame.

Make a place's view at each camera angle a scene uses the same way: render the set's coarse form from that shot's camera and restyle it against the canon plate, so every angle keeps one layout.

## Turnaround views

Views of a subject for an image-to-3D model or a modeler follow [turnaround views](turnaround-views.md).

## Inspect

Judge each image under [visual debugging](../visual-debugging/SKILL.md), against its record and its frozen canon references: identity and wardrobe, hands, scale against a door or a figure, light direction, lettering, and the blur or oversharpened edges that repeated edits leave.
