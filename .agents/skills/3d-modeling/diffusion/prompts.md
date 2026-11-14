# Prompts and inputs

How to write a request to a text- or image-to-3D model. The practices below are those two or more vendors state; each model's page adds its own, and its guide wins where it asks otherwise.

## Image input

An image gives the model far more than words, so prefer image-to-3D whenever the subject's look is decided:

- one subject, whole and filling the frame, on a plain white or transparent background, or cut out to transparency for a model that crops and centers it itself;
- even, diffuse light without harsh shadows or glare, because a shadow becomes a dark patch in the texture;
- a front or three-quarter view, from far away with a long lens, because perspective distortion becomes geometry;
- arms and legs apart in an A-pose or T-pose for a body that will be rigged, with the hands open and unobstructed;
- at least 1024 pixels on the short side.

Glass, mirrors, hair and thin wires reconstruct poorly; give such a subject an opaque reference, or build its thin parts in code.

Make the input under [image](../../image/SKILL.md), from the subject's frozen canon references: prompt it as a front or three-quarter view of the whole subject on a white background in its rest pose, and turn off any enhancement the 3D model offers that redraws the input, because it changes details.

## Views

Several views constrain the hidden sides. Give them only to a model that takes them, under the same light and framing, in the views it names: the front is required or read first, and the others are left, back and right or three-quarter views. Make them as [turnaround views](../../image/SKILL.md#turnaround-views-for-modeling) are made. A model that takes one image gains nothing from more.

## Text prompt

Without an image, describe the subject, then its materials, then its style, then any technical constraint, with the most important detail first. Name shape, material and scale concretely; a vague prompt such as "a box" fails, and more words do not help. Avoid contradictory or mood words and too many materials.

Write exclusions where the model has a negative field, and otherwise as plain statements such as "no text or labels". A model that turns text into an image first gains from a prompt written for that image.

## Settings over words

Pose, face count, topology, material channels, size, origin and symmetry are settings where the model offers them. A pose or count typed into the prompt is not reliable; set it.

## Iterate

Most hosted models generate the bare mesh first and texture it in a second, cheaper stage. Accept the mesh before paying for texture, and regenerate with another seed or a cleaner input rather than piling words onto the prompt. Record each accepted result as [Conditioning](../conditioning.md#freeze-the-source) sets, with its seed where the model takes one.

## Sources

[Meshy prompting](https://docs.meshy.ai/en/webapp/guides/prompting), [Meshy image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d), [Meshy image tips](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy), [Tripo text to model](https://developers.tripo3d.com/en/docs/generation-text-to-model/standard), [Tripo image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [Tripo image tips](https://www.tripo3d.ai/blog/best-images-for-image-to-3d), [Rodin Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5).
