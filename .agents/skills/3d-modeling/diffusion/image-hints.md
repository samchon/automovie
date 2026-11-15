# Image hints

An image gives the model far more than words, so prefer it whenever the subject's look is decided. These are requirements on the image; the project's own instructions say how the image is made.

## One image

- One subject, whole and filling the frame, on a plain white or transparent background, or cut out to transparency for a model that crops and centers it itself.
- Even, diffuse light without harsh shadows or glare, because a shadow becomes a dark patch in the texture.
- A front or three-quarter view from far away with a long lens, because perspective distortion becomes geometry.
- Arms and legs apart in an A-pose or T-pose for a body that will be rigged, with the hands open and unobstructed.
- At the resolution the model's guide asks for, with any enhancement that redraws the input turned off, because it changes details.

Glass, mirrors, hair and thin wires reconstruct poorly; give such a subject an opaque reference, or build its thin parts in code.

## Several views

Views constrain the hidden sides. Give them only to a model that takes them, in the views and order it names, under the same light and framing. The views must agree with each other, because views made one at a time drift apart; rendering them from a [shape](shape-hints.md) the subject already has keeps them aligned. A model that takes one image gains nothing from more.

Sources: [Meshy image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d), [Meshy image tips](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Meshy multi-image](https://docs.meshy.ai/api/multi-image-to-3d), [Tripo image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [Tripo multiview](https://developers.tripo3d.com/en/docs/generation-multiview-to-model/standard), [Tripo image tips](https://www.tripo3d.ai/blog/best-images-for-image-to-3d).
