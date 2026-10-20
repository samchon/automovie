# Construction

## Curves Into Skin

Generate common frames, principal curves and recursively derived intermediate curves from the existing inputs and the rules identified by [Reverse Analysis](reverse-analysis.md). Use millimetres for physical lengths and the declared units of other inputs. Skin and displayed construction consume the same curve family.

Choose regional methods from the observed form: trunk layers, limb sections along bone chains, hand and foot features, and facial loops or feature networks. Represent branches, contacts, openings and contour births or deaths explicitly instead of forcing loop pairings or closing open arcs.

Use [Lofting](../3d-modeling/lofting.md) and [Modularization](../3d-modeling/modularization.md) to assemble regional results. Each join consumes one shared boundary and compatible transverse derivatives with the actual orientation and parameter scale; positional agreement alone does not establish a smooth join. Judge each region with its neighbors and in the whole body.

Derive new vertices, faces and normals from this representation. Per-person control tables, normalized specimen copies, original mesh or normal fallback, hand-authored source controls and coordinate rounding cannot replace common generation rules.

Keep model refinement separate from mesh sampling: finer tessellation cannot repair missing features or wrong correspondence. Genitals and nipples remain outside the modeled surface.
