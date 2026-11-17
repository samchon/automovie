# Request

Generating again with a better request costs less than repairing a mesh. Ask for each of these the model offers, through its settings rather than prompt words where it has them:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation | Several subjects fused into one surface |
| A rest pose | Limbs fused to the body or to each other, and a failed automatic rig |
| Parts generated apart | Moving parts fused into one surface |
| The final triangle count | Far more triangles than any view needs |
| Separate material channels and a base color with the light removed | Light and shadow baked into the texture |
| A real-world size and an origin at the base | An arbitrary scale and origin |

The rest pose is for a body that will deform, and [image hints](image-hints.md#pose) sets it. Parts that move come apart through part-aware generation or segmentation, or by generating each part alone. The final triangle count is the one [Conditioning](../conditioning.md#reduction) would reduce to.

No request prevents the rest: a size that is only the model's estimate, an arbitrary facing, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

Most hosted models generate the bare mesh first and texture it in a second, cheaper stage, so accept the mesh before paying for texture. When a result fails, regenerate with another seed or a cleaner input rather than adding words to the prompt. Record each accepted result as [Conditioning](../conditioning.md#frozen-source) sets.
