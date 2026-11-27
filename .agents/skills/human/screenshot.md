# Screenshots

Use the shared [instrument](../visual-debugging/instrument.md) to inspect Human. Find commands in the [Human README](../../../packages/human/README.md#inspection), paths in the [inspection reference](../../../packages/human/docs/inspection.md) and options in [capture requests](../../../packages/render/docs/capture-requests.md).

## Selecting curves and parts

The skin is one sewn piece, `f1/body`, and every construction curve has a path under the person named by its family, so one pattern selects, hides, labels, colours and frames them. A family's surface cannot be drawn apart from the body: select its curves, and frame the body around them with `@focus`. Confirm from the capture's record that each selection matched what was meant, because an empty selection draws a still with no defect in it.

| Question | Selection |
| --- | --- |
| The skin alone | `parts=f1/body` |
| One family's curves | `parts=f1/arm` with `marks=curve/*` |
| Curves with their reflected twin | `parts=f1/arm*` with `marks=curve/*` |
| One side's curves only | `hide=*.mirror` with `marks=curve/*` |
| Fingers or toes | `parts=f1/finger.*` or `parts=f1/toe.*` |
| One section ring | `parts=f1/arm/section/3` with `marks=curve/*` |
| One family's rails and axis | `parts=f1/arm/guide/*,f1/arm/axis` |
| Family on skin | `marks=curve/*`, e.g. `three-quarter@focus=f1/arm` |
| Families alone and with neighbours | `sweep=f1/*` |

Include `marks=curve/*` for finger or toe curves, rails and axis and family sweeps. Give a family sweep its `margin` in metres.

The palm belongs to the arm and the foot to the leg. Use `label` to identify the selection, then remove labels that cover the shape.

## The three passes

Read a part's construction before its surface, through the same cameras, as [inspecting a form](../3d-modeling/inspection.md#construction) requires:

1. the construction alone: `marks=curve/*` with `surface=0`;
2. the construction over the clay surface: `marks=curve/*` with `shade=clay`;
3. the clay surface alone: `shade=clay`.

A named view fits itself to what is drawn, and the curves alone span less than the surface, so the three passes of one round take the views the first pass's record gives as each cell's repeat text, the fixed view that draws its camera again, orthographic ones included. Use `@ortho` on a named view where a length is read across the picture, and `@focus=<pattern>` for a close-up on a part or a joint, such as `three-quarter@focus=f1/finger.*` with `marks=curve/*`, since a focus on a family frames its curves.

## Reference comparison

The instrument draws the generated figure only. Until the reference mesh and its traced curves are handed to it, as a subject or as marks, a comparison of original curves or clay against the reference is unavailable evidence: record it as unobserved in the round, and never pass a curve from a still without its reference.

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves. The view comparison and reference-set estimates read the private section pack under `.references/curves/<alias>/`, preserving their existing reference set. Keep f1's published copies under `.references/curves/{hermite,bezier}/f1/`. Copied acquisition metadata remains historical; `basis-publication.json` identifies the newly published bytes and numerical observations separately from new captures.
