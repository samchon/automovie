# Image hints

An image tells the model far more than words, so give one whenever the subject's look is decided. This page sets what the image must show; the project's own instructions say how it is made.

## One image

Each image given to the model shows:

- one whole subject filling most of the frame, uncropped, with a margin on every side;
- a plain background in a color apart from the subject's, or real transparency, never a gradient or a reflective floor;
- even, diffuse light without harsh shadows or glare, because a shadow becomes a dark patch in the texture;
- a front or three-quarter view from far away with a long lens, because perspective distortion becomes geometry;
- the face and hands large enough to read, with the fingers apart;
- the resolution the model's guide asks for, with any enhancement that redraws the input's details turned off.

Many models remove the background, crop the subject square and pad it themselves. A square image with a real alpha channel spares the subject their background removal, which can cut into it; a drawn checkerboard is not transparency.

Glass, mirrors, hair and thin wires reconstruct poorly, so give such a subject an opaque reference or build its thin parts in code.

## Pose

A body that will be rigged stands with its arms and legs apart and holds no large prop, because limbs that touch fuse to the body or to each other. Choose the A-pose or the T-pose that the skeleton the result will be bound to expects, because a rig and a retargeter read the body's proportions from that pose.

## Several views

Views constrain the hidden sides, so give them to a model that takes them, in the views and order it names; a model that takes one image gains nothing from more. Make them under the same light, style, camera distance and scale, each with its background removed, and space them far enough apart to show different sides, because near-identical views make the model mirror one side.

The views must agree, and views made one at a time drift apart. Rendering them from a shape the subject already has keeps them aligned; some models instead generate the missing views from the front one, or read a single turnaround sheet.

Sources: [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy), [Meshy multi-view](https://www.meshy.ai/tutorials/multi-view-image-to-3d), [Unity humanoid avatar](https://docs.unity.com/en-us/engine/current/manual/assets-and-media/asset-types/models/importing/configuringthe-avatar), [Unreal retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine), [Meshy image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d), [Meshy image tips](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Meshy multi-image](https://docs.meshy.ai/api/multi-image-to-3d), [Tripo image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [Tripo multiview](https://developers.tripo3d.com/en/docs/generation-multiview-to-model/standard), [Tripo image tips](https://www.tripo3d.ai/blog/best-images-for-image-to-3d).
