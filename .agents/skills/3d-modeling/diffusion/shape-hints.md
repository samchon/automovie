# Shape hints

A shape the project already has, such as a rough proxy of primitives, a crafted form or a body, can steer generation more exactly than any picture. Choose the technique by what must hold:

| What must hold | Technique | How closely it holds |
| --- | --- | --- |
| The layout and proportions, while detail is added | Geometry condition | Close in layout, not in exact surface |
| The geometry exactly, while only appearance is added | Texture on the given mesh | Exactly, since the mesh is kept |
| The silhouette, while surface detail is added | Refinement of the given mesh | Close, for a mesh already near the final shape |
| The layout, when no model takes a shape | Views rendered from the shape | Loosely, through [image hints](image-hints.md) |
| A body's skeleton | Pose condition and rigging onto the given skeleton | Close in pose; the skeleton exactly when rigged onto it |

## Geometry condition

A model that takes a mesh, voxels, a point cloud or a bounding box as a condition generates a new detailed mesh whose layout follows it, usually beside an image or prompt for appearance. It is not a stretch of the proxy: a longer box may gain parts, such as a sofa's extra legs. A model that partly noises the condition before denoising trades faithfulness against realism through that strength.

Examples: [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni), which takes point, voxel, box or pose conditions; [SpaceControl](https://github.com/spacecontrol3d/spacecontrol), over TRELLIS; [TRELLIS variants](https://github.com/microsoft/TRELLIS), from a mesh and a prompt.

## Texture on the given mesh

A texturing model paints the given mesh from a prompt or a reference image and keeps its geometry. Use it when the shape is final; on a bare proxy it only paints the primitives.

Examples: [Hunyuan3D-Paint](https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1), [TRELLIS.2 texturing](https://github.com/microsoft/TRELLIS.2), [MV-Adapter](https://github.com/huanngzh/MV-Adapter); hosted retexturing of an uploaded mesh, such as [Meshy](https://docs.meshy.ai/en/api/retexture) or [Tripo](https://developers.tripo3d.com/en/docs/models-texture).

## Refinement of the given mesh

A refiner adds geometric detail to a mesh from a reference image, anchored to its voxels. It expects a mesh already near the final shape, far finer than a few primitives.

Examples: [UltraShape](https://github.com/PKU-YuanGroup/UltraShape-1.0), [DetailGen3D](https://github.com/VAST-AI-Research/DetailGen3D).

## Views rendered from the shape

Render depth or normal views of the shape from fixed cameras, restyle each under depth control from the same references, then give them to a multiview model or project them back onto the shape. Generating the views together, or each with the earlier ones as context, keeps them from drifting apart.

Examples: [LooseControl](https://github.com/shariqfarooq123/LooseControl), depth control from boxes; [StableGen](https://github.com/sakalond/StableGen), projection in Blender.

## Bodies

A pose condition takes the skeleton's joint points and keeps the generated body aligned to them. A rigging service that accepts a custom skeleton, or a rigging model that predicts weights for a given skeleton, binds the result to the project's own joints under [Rigging](../rigging.md).

Examples: the pose condition of [Hunyuan3D-Omni](https://github.com/Tencent-Hunyuan/Hunyuan3D-Omni); [Rodin rigging](https://docs.hyper3d.ai/en/api-specification/rigging.md) with a custom bone hierarchy; [UniRig](https://github.com/VAST-AI-Research/UniRig).

Read each example's license and territory before adopting it; several open models exclude regions or large services.
