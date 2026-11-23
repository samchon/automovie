# Construction

## Representation

Pick the representation by the form, then optimize the form within it:

| Representation | The form |
| --- | --- |
| Code CAD | Made of dimensions, such as furniture or a building |
| Lofted sections | One section changing along an axis, such as a limb or a bottle |
| Procedural rules, such as grammars or scattering | Repeated structure, such as a fence or foliage |
| Implicit surfaces | Blended masses that never deform |
| Formula fields, such as displacement | Fine detail over any of these |

Build code CAD from dimensioned primitives with extrusion, revolution, sweeps and Boolean operations. Use installed operations or an established kernel for Booleans and offsets.

Generate vertices and faces from dimensioned formulas. Draw the construction beside the result to trace defects to their inputs.

## Definition and dimensions

### Generating definition

Use one generating definition for sections, guides, parameter directions or their equivalents. Evaluate placements, attachments, weights, UVs, joins and measurements on that definition. Measure a subdivision surface on its limit surface.

Tessellate last for rendering and export. Compute geometric quantities on the generating definition, independently of tessellation.

A mesh used or generated as it is, an imported mesh's weights, and a fixed source observed for mesh recovery have no generating definition, so their own triangles are what is measured.

### Dimensions

Derive positions in local frames from named dimensions and dimensionless ratios. Give related curves shared axes, parameters and constraints. Keep independently measured dimensions independent and cite calibration inputs.

Construct and check published measurements at their defined sites. Correct a misdefined input at its source.

Size a feature on a surface in physical units through the surface's metric, because a feature sized in chart parameters changes size whenever the surface or its layout changes.

## Resolution

Let the number of emitted primitives follow the resolution setting, not the number of crafted features, and spend them where the surface curves or forms the silhouette. Keep defining dimensions and feature locations independent of tessellation. A more compact representation of the same form keeps the same mesh. Use parametric surfaces, subdivision, cards, instances or levels of detail where applicable.

On a subdivision surface, place extraordinary vertices where curvature is low and keep them at valence 3 or 5 where the layout allows, because higher valences and clustered poles leave visible pinches on the limit surface.

## Evaluation

Precompute each section or segment's coefficients and derivatives for constant-time evaluation. Invert parameters by lookup or an analytic step. Solve dimensions on the controlled part alone.

## Tests

Test each operator against an analytic oracle, including its declared continuity at joins.

Audit invariants generically over every section and join of the finished form: each section closed and free of self-intersection, each surface continuous, and the declared continuity held across each join.

Check each input on the finished form at its own definition, such as a measurement taken at its site the way it is defined, because a per-part test that recomputes the construction's formulas passes whatever the construction does.

## Stylization

Apply stylization as separate transforms over the generating curves and parts. Record it as a project decision.

## Order of work

Build from whole form to local detail, attaching details to the coarser form. Cover the whole form and finer regions in every correction round.

Regenerate dependent outputs when their inputs change. Correct faulty representations at their source.
