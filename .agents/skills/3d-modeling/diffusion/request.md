# Request

Use these model settings where available:

| Ask for | Otherwise expect |
| --- | --- |
| One subject per generation | Several subjects fused into one surface |
| A rest pose | Limbs fused to the body or to each other, and a failed automatic rig |
| Parts generated apart | Moving parts fused into one surface |
| The final triangle count | Far more triangles than any view needs |
| Separate material channels and a base color with the light removed | Light and shadow baked into the texture |
| A real-world size and an origin at the base | An arbitrary scale and origin |

Set deforming bodies' [rest pose](image-hints.md#pose). Separate moving parts by generation or segmentation. Use [Conditioning](../conditioning.md#reduction) for the final triangle budget.

No request prevents the rest: a size that is only the model's estimate, an arbitrary facing, melted thin parts, loose pieces, holes, inner surfaces, and a rig that is a first guess on the model's own skeleton.

Accept the mesh before requesting texture if the service separates those steps. On failure, try a cleaner input or another seed. Record the accepted result under [Conditioning](../conditioning.md#frozen-source).
