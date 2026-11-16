# Request

Generating again with a better request costs less than repairing a mesh. Ask for each of these the model offers, through its settings rather than prompt words where it has them:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation | Several subjects fused into one surface |
| A rest pose, as [image hints](image-hints.md#pose) sets, for a body that will deform | Limbs fused to the body or to each other, and a failed automatic rig |
| Part-aware generation or segmentation, or each part generated alone, for parts that move | Moving parts fused into one surface |
| The triangle count [Conditioning](../conditioning.md#reduction) would reduce to | Far more triangles than any view needs |
| Separate material channels and a base color with the light removed | Light and shadow baked into the texture |
| A real-world size and an origin at the base | An arbitrary scale and origin |

No request prevents the rest: a size that is only the model's estimate, an arbitrary facing, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

Most hosted models generate the bare mesh first and texture it in a second, cheaper stage, so accept the mesh before paying for texture. When a result fails, regenerate with another seed or a cleaner input rather than piling words onto the prompt. Record each accepted result as [Conditioning](../conditioning.md#frozen-source) sets.
