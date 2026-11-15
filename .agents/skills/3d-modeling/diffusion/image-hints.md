# Image hints

An image gives the model far more than words, so prefer it whenever the subject's look is decided. These are requirements on the image; the project's own instructions say how the image is made.

## One image

Each image given to the model has:

- one whole subject filling most of the frame, with a margin on every side and nothing cropped;
- a plain background in a color apart from the subject's, or real transparency, never a gradient or a reflective floor;
- even, diffuse light without harsh shadows or glare, because a shadow becomes a dark patch in the texture;
- a front or three-quarter view from far away with a long lens, because perspective distortion becomes geometry;
- the face and hands large enough to read, with the fingers apart;
- the resolution the model's guide asks for, with any enhancement that redraws the input's details turned off.

A body that will be rigged stands with its arms and legs apart and holds no large prop. Choose the A-pose or the T-pose that the target skeleton or retargeter expects, because a rig and a retargeter read the body's proportions from that pose and are more accurate when the poses match.

Open models cut the subject out, crop it square and pad it themselves, so give them a square image with a real alpha channel; a drawn checkerboard is not transparency.

Glass, mirrors, hair and thin wires reconstruct poorly; give such a subject an opaque reference, or build its thin parts in code.

## Several views

Views constrain the hidden sides. Give them only to a model that takes them, in the views and order it names, under the same light, style, camera distance and scale, each with its background removed. Space them 45 to 90 degrees apart, because near-identical views make the model mirror one side. The views must agree with each other, because views made one at a time drift apart; rendering them from a [shape](shape-hints.md) the subject already has keeps them aligned, and some models generate the missing views from the front one or read a single turnaround sheet. A model that takes one image gains nothing from more.

Sources: [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy), [Meshy multi-view](https://www.meshy.ai/tutorials/multi-view-image-to-3d), [Unity humanoid avatar](https://docs.unity.com/en-us/engine/current/manual/assets-and-media/asset-types/models/importing/configuringthe-avatar), [Unreal retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine), [Meshy image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d), [Meshy image tips](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Meshy multi-image](https://docs.meshy.ai/api/multi-image-to-3d), [Tripo image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [Tripo multiview](https://developers.tripo3d.com/en/docs/generation-multiview-to-model/standard), [Tripo image tips](https://www.tripo3d.ai/blog/best-images-for-image-to-3d).
