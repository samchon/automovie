# Shape hints

A shape the project already has, such as a coarse form of a few primitives or a body, steers generation more exactly than any picture. Choose the technique by what must hold; [3D models](models.md#shape-techniques) names current examples of each:

| Technique | What must hold |
| --- | --- |
| Geometry condition | The layout and proportions, while detail is added |
| Texture on the given mesh | The geometry exactly, while only appearance is added |
| Refinement of the given mesh | The silhouette, while surface detail is added |
| Views rendered from the shape | The layout, when no model takes a shape |
| Pose condition and rigging onto the given skeleton | A body's skeleton |

## Techniques

### Geometry condition

A model that takes a mesh, voxels, a point cloud or a bounding box as a condition generates a new detailed mesh whose layout follows it, though not its exact surface, usually beside an image or prompt for appearance. It does not stretch the coarse form: a longer box may gain parts, such as a sofa's extra legs. A model that partly noises the condition before denoising trades faithfulness against realism through that strength.

### Texture on the given mesh

A texturing model paints the given mesh from a prompt or a reference image and keeps its geometry exactly, so use it once the shape is final; on a coarse form it only paints the primitives.

### Refinement of the given mesh

A refiner adds geometric detail to a mesh from a reference image, anchored to its voxels, and expects a mesh already near the final shape, far finer than a few primitives.

### Views rendered from the shape

Render depth or normal views of the shape from fixed cameras, restyle each under depth control from the same references, then give them to a multiview model or project them back onto the shape. Generate the views together, or each with the earlier ones as context, so they do not drift apart. The shape holds only loosely this way, through [image hints](image-hints.md#several-views).

### Bodies

A pose condition takes the skeleton's joint points and keeps the generated body close to them in pose. A rigging service that accepts a custom skeleton, or a rigging model that predicts weights for a given skeleton, then binds the result to the project's own joints under [Rigging](../rigging.md), which keeps the skeleton exactly.
