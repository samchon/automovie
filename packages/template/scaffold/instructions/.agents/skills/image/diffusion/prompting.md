# Image prompting

How to write any image prompt. The chosen generator's own prompting guide, linked from [models](models.md), wins where it asks otherwise.

## Structure

Open with the subject, the image's use, its composition and its aspect, then give details and constraints; in a long prompt, label these as sections. Describe each subject in its record's words.

Describe the intended subject, material, color, scale and light. Use exclusions in the wording or negative-prompt field the chosen guide supports.

Camera and lens words are cues for the look, not a simulated camera, so an exact camera comes from a render under [conditioning](conditioning.md).

## Input images

Number each input image and give it one role in the prompt, such as "Image 1: identity of Mara; Image 2: the kitchen plate", never as text in the image. Say how the inputs combine and what not to take from each, such as a reference's background, and name each image in the same words every time.

Order inputs by the chosen endpoint's documented roles, never by another model's order: the first may set the base image, the mask target, identity fidelity or the output aspect.

Set output size and aspect explicitly, and keep both the render's structural role and the canon references' identity roles clear when their order changes.

## Lettering

Quote the exact text with its placement and typeface, and specify which text may appear. Use the chosen guide's spelling aids where needed, then check spelling and legibility on the result.

## Rewriting and grounding

Turn off optional rewriting and web grounding, which can alter a shared description or replace an invented subject. When expansion is required, inspect and retain the expanded text if exposed. Otherwise record that it is unobservable, keeping the authored prompt and references.
