# Canon references

A canon reference fixes a subject's look for later images and video. Make the views promised in the commission or needed by the adopted model. Have the user accept them and reuse the accepted originals.

## Views

<!-- @reference [Runway’s Gen-4 reference guide](https://help.runwayml.com/hc/en-us/articles/40042718905875-Gen-4-Image-References-Guide) recommends even lighting and a neutral expression. -->

Model-neutral casting photographs can precede video model selection. Embed each candidate view in its [subject record](../story/document-layout.md#canon-records) and mark it pending until the user accepts it.

For model-specific references, use the chosen model's documented limits and required views. Budget its inputs across the subjects in each shot.

Where the commission and guide leave a character's views open, use these defaults. Show one person per image in the canonical wardrobe with flat light, a plain background and an unobstructed face:

- a front full-body view, standing with the arms relaxed at the sides;
- a face close-up with a neutral expression;
- three-quarter, profile or back views as the shots need.

For a prop reference, use a plain background. For a location plate, show the empty set in the required light. Save each view separately.

Where the chosen model's terms reject references with real human faces or minors, ask the user how to give it identity, and record the answer in [project context](../production/project-context.md).

## Prompts

Use the subject's record wording and the film's medium or rendering style, shared with the video prompts' [description](../video/diffusion/prompts.md#shared-description). Repeat its defining details beside the references, as [words](diffusion/consistency.md#words) sets, and write the rest of the request under [prompting](diffusion/prompting.md).

A canon reference or plate needs no render beside its prompt, except where [control images](diffusion/conditioning.md#control-images) set one.

## States

A wardrobe, makeup or wound state of a story day is its own reference set. Generate it from the base canon references, then freeze it as that state's canon references.

## Accepted and derived images

Keep each accepted original and its content credentials. Record it under [media records](../production/media-records.md) and reuse it.

Create the initial canon references from the subject record. Start derivative views, shot frames and variants from the frozen canon references.

Judge each image from stills and compare it with its record and applicable canon references. Check identity and wardrobe, hands, scale against a door or a figure, light direction, lettering, and the blur or oversharpened edges that repeated edits leave.
