# Crafting

A crafted form is code: named dimensions and formulas that the engine turns into geometry the same way every time.

Organize its parts and groups by [Modularization](modularization.md), and test its construction as [Tests](#tests) describes, within the project's [testing](../development/testing.md) rules.

## Representation

Pick the representation by the form, then optimize the form within it:

| The form | Representation |
| --- | --- |
| Made of dimensions, such as furniture, a machine, a building or a tool | Code CAD: dimensioned primitives with extrusion, revolution, sweep and boolean operations |
| One section changing along an axis, such as a limb, a torso, a hull or a bottle | Sections lofted along that axis, under [Lofting](lofting.md) |
| Repeated structure, such as a fence, a facade or foliage | Procedural rules, such as grammars or scattering |
| Blended masses that never deform | Implicit surfaces |
| Fine detail over any of these | Formula fields, such as displacement |

Take boolean and offset operations from the installed packages or an established solid-modeling kernel, because a hand-written boolean leaves open and self-intersecting surfaces.

Crafting pays where dimensions define the form or a parameter must control it. For an organic form no parameter controls, such as an animal, a face or draped cloth, propose [Diffusion](diffusion.md) or [Sources](sources.md) to the user first, because authoring that surface costs far more than [Conditioning](conditioning.md) a mesh.

Never shape a form by placing vertices, triangles, or polygons by hand; vertices are only what the formulas emit.

A coding agent works under four limits, and each favors these representations over hand-placed geometry:

| The agent | What serves it | Hand-placed geometry |
| --- | --- | --- |
| Changes text by meaning | Named values let it reason about each change | A coordinate means nothing |
| Holds only part of a form in mind | Parts let it build the form piece by piece | The form runs into thousands of coordinates |
| Cannot see the surface while it edits | Local edits keep a fix where it was made | Moving a vertex disturbs neighbors it cannot see |
| Judges a render it did not draw | A construction drawn beside the surface, such as sections, sketches or a generation skeleton, traces each defect to the value that made it | A mesh has no construction to trace |

## Generating definition

Keep a loft's sections, guides and parameter directions related through one generating definition, and another representation's sketches, fields or procedural structure likewise. Evaluate every geometric quantity of the form on that definition: placements, attachments, skin weights, texture coordinates, measurements and the joins between parts. Measure the displayed surface as the definition evaluates it, such as a subdivision limit surface rather than its cage.

Tessellation is the last step, made for renderers and exporters, and nothing is read back from it; a quantity found by reading, searching, clipping, ray casting or relaxing the emitted triangles moves with the detail setting, so it drifts between preview and final render and answers to no input.

A directly used or generated mesh, an imported mesh's weights under [Rigging](rigging.md), and a fixed source observed for [Recovery](recovery.md) have no generating definition, so their own triangles are what is measured.

## Dimensions

Construct positions in each part's local frame from named dimensions and dimensionless ratios tied to shared axes, landmarks and boundaries. Express related curves as a parameterized family with shared dimensions and constraints, keeping independent measurements as independent parameters.

Keep calibration in named, sourced dimensions and coefficients; never patch individual cases with absolute vertex coordinates or duplicate a neighbor's placement constants.

When a dimension names a published measurement, construct it at that measurement's site and by its definition, and check it the same way. A dimension placed by a private convention only measures itself back, and a factor that absorbs a wrongly measured input becomes an error once the input is corrected.

Size a feature on a surface in physical units through the surface's metric. A feature sized in chart parameters changes size whenever the surface or its layout changes.

## Resolution

Let the number of emitted primitives follow the resolution setting, not the number of crafted features, and spend them where the surface curves or forms the silhouette rather than evenly. Keep defining dimensions and feature locations independent of tessellation. Use a parametric surface, subdivision, cards, instances, or levels of detail where the form allows.

On a subdivision surface, place extraordinary vertices where curvature is low and keep them at valence 3 or 5 where the layout allows, because higher valences and clustered poles leave visible pinches on the limit surface.

## Evaluation

Set up each section or segment once, with its coefficients and derivatives, and evaluate each point from that setup in constant time. Invert a parametrization with a table or an analytic step, such as Newton's method on the analytic derivative, rather than a long bisection over full evaluations. Solve a dimension on the part it controls instead of regenerating the whole form inside a solver loop.

Slow generation lengthens every [correction round](visual-debugging.md#correction-rounds), and a round that costs too much invites local patches in place of repairs at the cause.

## Tests

Test each construction operator alone against an analytic oracle on made inputs, such as the intersection of two orthogonal cylinders against the Steinmetz curve, or a blend's declared continuity at both of its rails.

Audit invariants generically over every section and join of the finished form: each section closed and free of self-intersection, each surface continuous, and the declared continuity held across each join.

Check each input on the finished form at its own definition, such as a measurement taken at its site the way it is defined. A per-part test that recomputes the construction's formulas passes whatever the construction does.

## Stylization

Express stylization, such as exaggerated proportions or fantasy features, as a separate layer of transforms over the generating curves and parts rather than as edits inside their construction. The base construction and its tests then stay valid underneath, and every repair to the base reaches the stylized variant. Record an adopted stylization where the project records its decisions.

## Order of work

Build the whole form first, then each finer detail as the block-out of a smaller region placed on the coarser form, so a coarse change carries its details with it.

Scale orders construction and inspection, never correction. Each [correction round](visual-debugging.md#correction-rounds) inspects the whole form and every finer region, neighbor and close-up, then fixes every cause it found in one combined change; a traced cause at a finer scale is fixed in that round, not saved for a later round or scale.

Regenerate anything derived when its basis changes, and repair an unsound representation at its foundation instead of stacking corrections on it.
