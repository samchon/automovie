# Text prompts

A text prompt is the weakest hint, so use it alone only when no image or shape describes the subject, and beside them only as far as the model's guide asks; some guides say to omit it for image-to-3D.

Describe the subject, then its materials, then its style, then any technical constraint, with the most important detail first. Name shape, material and scale concretely; a vague prompt such as "a box" fails, and more words do not help. Avoid contradictory or mood words and too many materials.

Write exclusions where the model has a negative field, and otherwise as plain statements such as "no text or labels". A model that turns text into an image first gains from a prompt written for that image.

Pose, face count, topology, material channels, size, origin and symmetry are settings where the model offers them; typed into the prompt they are not reliable.

Sources: [Meshy prompting](https://docs.meshy.ai/en/webapp/guides/prompting), [Tripo text to model](https://developers.tripo3d.com/en/docs/generation-text-to-model/standard), [Rodin Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5), [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy).
