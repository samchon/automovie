# Screenshots

Use AutoMovie's shared instrument to inspect Human interactively or to save a round of stills, sheets and camera records. The Human README lists available subjects and paths, and the render README defines the request keys. [Instrument](../visual-debugging/instrument.md), [Human inspection](../../../packages/human/README.md#inspection), [request keys](../../../packages/render/README.md#request-keys).

## Selecting curves and parts

Use `parts` and `hide` to select geometry by path. Use `marks` to select construction marks by kind. A part's curves can frame its local surface with `@focus`. Check the captured selections and opened stills before using them as evidence.

| Question | Selection for `ansur-upper-arm-envelope` |
| --- | --- |
| Surface alone | `parts=ansur-upper-arm-envelope/upperarm` |
| Construction curves | `marks=curve/*` with `surface=0` |
| One section ring | `parts=ansur-upper-arm-envelope/upperarm/section/1` with `marks=curve/section` |
| Longitudinal curves | `marks=curve/guide,curve/axis` |
| Clay close-up | `shade=clay` with `three-quarter@focus=ansur-upper-arm-envelope/upperarm` |

Use `label` to confirm the identities in a view and remove it when labels obscure the shape.

## The three passes

Read the construction and the skin through the same cameras. [Inspecting a form](../3d-modeling/inspection.md#construction).

1. Draw the construction alone with `marks=curve/*` and `surface=0`.
2. Overlay the construction on clay with `marks=curve/*` and `shade=clay`.
3. Draw the clay with `shade=clay` and omit the mark selection.

Use a named view with `@ortho` where the image needs a consistent in-plane scale, and `@focus=<pattern>` for the joint close-up. Use each cell's fixed repeat view from the capture record across the three passes. Named views refit to the geometry visible in each pass.

## Reference comparison

For a comparison, open the same region in a public reference with a comparable pose and camera. Record the source revision, pose and scale with the round. Use its visible features and any measured deviation to explain the visual judgment. Inspect naturalness in the clay, curves over clay and close views. Record when the source fails to give a comparable view. [Public reference and acceptance](../../../packages/human/docs/testing/consistency.md).
