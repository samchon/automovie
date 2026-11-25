# Human inspection selectors

Inspect the body in the checkout using the [Human commands](../README.md#inspection). Use [capture request keys](../../render/docs/capture-requests.md) to select, frame and mark parts.

## Subject and part paths

Use `f1` for the default person or `<person>@<pose>` when the subject defines another pose.

| Path | What it selects |
| --- | --- |
| `f1` | The whole person |
| `f1/body` | The sewn skin, including its joined limbs, digits, ears and nose |
| `f1/<family>` | A family's construction curves, and its surface when it has a separate piece |
| `f1/<family>.mirror` | The reflected family's curves or piece |
| `f1/<family>/section/<k>` | Section ring at authored knot `k` |
| `f1/<family>/guide/<q>` | Guide rail at quarter phase `q` from 0 to 3 |
| `f1/<family>/axis` | The line through the ring centres |
| `f1/probe/<name>` | A probe such as `legs` or `finger.index-middle.mirror` |

Use `--marks "curve/*"` to draw section rings, guide rails and axes. Add `--surface 0` for curves alone. The skin is a single piece, so use the family's curves to frame a close-up with `@focus`.

## Probe marks

Use `--marks "probe/*"` to see points the generator sampled in open spaces such as the gaps between fingers or legs. Read the mark kind before interpreting a point.

| Mark | Meaning |
| --- | --- |
| `probe/empty` | The sampled point lies outside the skin |
| `probe/filled` | The point lies inside or on the skin |
| `probe/outside-hull` | The point is outside the source families' convex hull |

A probe the generator could not place is listed with its reason and has no mark.
