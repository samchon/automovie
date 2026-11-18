# Canon references

Canon references are a subject's frozen images, the source of its look for every later image and video request. Make them once for each subject, have the user accept them and freeze them as every accepted image is frozen.

## Views

For a generated film, choose the [video model](../video/SKILL.md) first; its guide determines reference views and limits. Budget the request's inputs across its subjects, making only the views the shots need.

Where the guide sets none, give each character these views, one person in each, sharp, with the face unobstructed, on a plain background with flat light and the canonical wardrobe:

- a front full-body view, standing with the arms relaxed at the sides;
- a face close-up with a neutral expression;
- three-quarter, profile or back views as the shots need.

Give each prop a plain-background image and each scene lighting state an empty location plate. Save each view separately.

Where the chosen model's terms reject references with real human faces or minors, ask the user how to give it identity, and record the answer in [project context](../production/project-context.md).

## Prompts

Use the subject's record wording and the film's medium or rendering style, shared with the video prompts' [description](../video/diffusion/prompts.md#shared-description). Repeat its defining details beside the references, as [words](diffusion/consistency.md#words) sets, and write the rest of the request under [prompting](diffusion/prompting.md).

A canon reference or plate needs no render beside its prompt, except where [control images](diffusion/conditioning.md#control-images) set one.

## States

A wardrobe, makeup or wound state of a story day is its own reference set. Generate it from the base canon references, then freeze it as that state's canon references.
