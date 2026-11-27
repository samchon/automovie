# Image hints

Supply a reference image when appearance is decided.

## One image

Each image given to the model shows:

- one uncropped subject filling most of the frame, with a margin on every side
- a plain contrasting background or real transparency
  - Never use a gradient or reflective floor.
- even diffuse light without glare or hard shadows
  - A shadow becomes a dark patch in the texture.
- a distant front or three-quarter view with a long lens
  - Perspective distortion becomes geometry.
- the face and hands large enough to read, with the fingers apart
- the resolution in the model guide
  - Disable enhancement that redraws input details.

If the model crops or removes backgrounds, provide a square image with a real alpha channel to protect the silhouette.

Glass, mirrors, hair and thin wires reconstruct poorly, so give such a subject an opaque reference or build its thin parts in code.

## Pose

Keep the limbs apart and remove large props before rigging. Use the target skeleton's A-pose or T-pose.

## Several views

For multi-view input, follow the model's view list and order. Keep light, style, distance and scale consistent, isolate the subject and show distinct sides.

Use registered views from one shape where available. Otherwise use a model-supported turnaround or generate missing views from the first.

Sources: [Meshy pose and hands](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy), [Meshy multi-view](https://www.meshy.ai/tutorials/multi-view-image-to-3d), [Unity humanoid avatar](https://docs.unity.com/en-us/engine/current/manual/assets-and-media/asset-types/models/importing/configuringthe-avatar), [Unreal retargeting](https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine), [Meshy image to 3D](https://docs.meshy.ai/en/webapp/image-to-3d), [Meshy image tips](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Meshy multi-image](https://docs.meshy.ai/api/multi-image-to-3d), [Tripo image to model](https://developers.tripo3d.com/en/docs/generation-image-to-model/standard), [Tripo multiview](https://developers.tripo3d.com/en/docs/generation-multiview-to-model/standard), [Tripo image tips](https://www.tripo3d.ai/blog/best-images-for-image-to-3d).
