# Image prompting

How to write any image prompt. The chosen generator's own prompting guide, linked from [models](models.md), wins where it asks otherwise.

## Structure

Open with the subject, the image's use, its composition and its aspect, then give details and constraints; in a long prompt, label these as sections. Describe each subject in its record's words.

Describe the intended subject, material, color, scale and light. Use exclusions in the wording or negative-prompt field the chosen guide supports.

Render exact camera placement through [conditioning](conditioning.md).

## Input images

Number the input images and assign each a role in the prompt. Reuse its label and specify which features to take or exclude.

Order inputs by the chosen endpoint's documented roles, never by another model's order: the first may set the base image, the mask target, identity fidelity or the output aspect.

Set output size and aspect explicitly, and keep both the render's structural role and the canon references' identity roles clear when their order changes.

## Lettering

Quote the exact text with its placement and typeface, and specify which text may appear. Use the chosen guide's spelling aids where needed, then check spelling and legibility on the result.

## Rewriting and grounding

Disable optional rewriting and web grounding. Inspect and retain required expansions when exposed. Otherwise record the observation limit and keep the authored prompt and references.
