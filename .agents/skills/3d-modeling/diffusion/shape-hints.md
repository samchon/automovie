# Shape hints

Start with the existing geometry. Choose a technique by what must hold. See [3D models](models.md#shape-techniques) for implementations.

| Technique | What must hold |
| --- | --- |
| Geometry condition | The layout and proportions, while detail is added |
| Texture on the given mesh | Exact geometry while adding appearance |
| Refinement of the given mesh | The silhouette, while surface detail is added |
| Views rendered from the shape | The layout, when no model takes a shape |
| Pose condition and rigging onto the given skeleton | A body's skeleton |

## Techniques

### Geometry condition

Geometry conditioning guides a new mesh's layout and proportions. Supply appearance separately where required. Where the model adds noise to the condition, use its strength setting to control adherence.

### Texture on the given mesh

A texturing model paints the given mesh from a prompt or a reference image and keeps its geometry exactly, so use it once the shape is final; on a coarse form it only paints the primitives.

### Refinement of the given mesh

A refiner adds geometric detail to a mesh from a reference image, anchored to its voxels, and expects a mesh already near the final shape, far finer than a few primitives.

### Views rendered from the shape

Render depth or normals from fixed cameras. Restyle under depth control with shared references, then use a multiview model or reproject onto the shape. Generate views together or pass earlier views as context. This [image guidance](image-hints.md#several-views) preserves shape loosely.

### Bodies

Condition the pose on the skeleton's joint positions. Use a service that accepts the project skeleton or a model that predicts weights for it. Bind the result to those exact joints under [Rigging](../rigging.md).
