# Request

Generating again with a better request costs less than repairing a mesh, so ask for whichever of these the model offers, through its settings rather than prompt words:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation, alone on a plain background in an input image | Several subjects fused into one surface |
| A rest pose with the arms and legs apart, an A-pose or a T-pose, for a body that will deform | Limbs fused to the body or to each other, and a failed automatic rig |
| Part-aware generation or segmentation, or each part generated alone, for parts that move | Moving parts fused into one surface |
| The triangle count [Conditioning](../conditioning.md#reduce) would reduce to | Far more triangles than any view needs |
| Separate material channels and a base color with the light removed | Light and shadow baked into the texture |
| A real-world size and an origin at the base | An arbitrary scale and origin |

No request removes the rest: a size that is only the model's estimate, an arbitrary facing, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

Most hosted models generate the bare mesh first and texture it in a second, cheaper stage. Accept the mesh before paying for texture, and regenerate with another seed or a cleaner hint rather than piling words onto the prompt. Record each accepted result as [Conditioning](../conditioning.md#freeze-the-source) sets, with its seed where the model takes one.
