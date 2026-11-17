# Text prompts

A text prompt is the weakest hint. Use it alone only when no image or shape describes the subject, and beside them only as far as the model's guide asks, since some guides say to omit it for image-to-3D. Beside an image, give only what the image lacks, such as materials and the unseen sides, because a long prompt dilutes the image.

Describe the subject, then its materials, its style and any technical constraint, most important detail first, unless the model's guide sets another order. Name shape, material and scale concretely: a vague prompt such as "a box" fails, and more words do not help. Leave out contradictions, mood words and long lists of materials.

Write exclusions in the model's negative field where it has one, and otherwise as plain statements such as "no text or labels". For a model that turns text into an image first, write the prompt for that image.

Sources: [Meshy prompting](https://docs.meshy.ai/en/webapp/guides/prompting), [Tripo text to model](https://developers.tripo3d.com/en/docs/generation-text-to-model/standard), [Rodin Gen-2.5](https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5), [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy).
