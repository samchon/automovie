# Construction

## Tree

- Build the whole figure as one construction tree of the interface's construction types (`packages/interface/src/construction`). The engine's `realizeAutoMovieConstruction` realizes it once into chains, joins, trims and one skin. The Human package derives the nodes from the person's inputs and laws, and reads what the realization publishes. Lofting, joining, trimming and tessellation belong to the engine, so every person and every other form share one tested kernel.
- Make each part a view part: three-view lofting from its own front and side outline pairs and its fullness (the top view), about its own axis. The outlines own the section's extremes, so breadth, depth and girth hold together, and a surface defect traces back to the view curves that made it.
- Attach each protruding part to its host with a merge, which only grows the volume. Cut a recess as a diff, continue a part from its host's end, and open a fissure, nostril, mouth or ear canal as a trim. Build the host as the envelope without the protruding part, and derive each blend's width from the part's own size or curvature, so the part is built independently of its host's curves.
- Derive every join's seed, every trim's landmarks, and every region a part starts from or is confined to from landmark curves, courses and the bind skeleton, so each follows the person rather than the surface it shapes.
- Take a form the tree cannot express to the kernel as a general capability. Design it in the interface and self-review it, then implement it in the engine with its operator tests before any part uses it, because a part-local workaround forks the kernel and escapes its tests.
- Publish the realized chains and body as the one source for every stage after the skin (rig, binding, appearance, garments), because a second body drifts from the first and doubles the work.

## Form

- Build both sides through one canonical construction and a declared reflection, including boundary maps, derivatives and orientation.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, and keep common mathematics in one shared module.
- Loft each limb and digit on its own bone.
- Split a part by sub-part, sector of its girth, layer span and axis, only along named anatomical loci, down to the smallest unit that is anatomically and topologically one structure, and build each piece by its own rule in its own frame, so it can be built, checked and transformed alone.
- Let one curve at one height be several pieces. Structures at the same height that have different centres, such as the breast and the rib cage at rib level, are built apart on their own axes and merged, and a side profile curve alone may be a piece.
- Differentiate only smooth functions, analytically or on a smooth fit; a finite difference across a clamp or a step throws the surface.
- Let a part or join that cannot keep its contract leave the tree with one diagnostic, as the realization rolls back a failed subtree. Generation then returns a figure for every valid person, and the diagnostic names the defect.
- Give every piece its own file, named for its part and piece, so it is found, read, tested and replaced alone; a part's file only composes its pieces, and shared mathematics stays in the shared modules.
- Keep the section representation until a part shows it cannot carry the law; a new representation spreads into joins, caps, normals and sampling.
- Make skin and its junctions smooth through their generating mathematics alone, so no global fit or smoothing pass hides a seam.
- Keep full skin, the generation path, rigs, export and other consumers working at every commit.
- Leave genitals and nipples out of the modelled skin.

## Numbers

- Reduce independent numbers and keep every curve, guide, section and knot a part's shape needs: universalizing a law means finding the rule that produces those curves, and a chain too sparse to carry its shape is raised.
- Hold a number that is a fact of the world as a named constant shared by every person: a definition, a unit factor, a published range, a cited anatomical ratio, or a shape prior in normalized part coordinates. Compute every value that must follow the person's inputs, so that no constant fixes one person's value.
- Give every constant and every curve a published source, a population measurement or a derivation, and state that reason in its doc comment, so a reader can judge it against the anatomy. Turn a value repeated across features into the rule that produces it.
- When an input or its definition changes, replace a prior fitted to it by the definition, and solve the measure against the construction's own surface.

## Inputs

- Construct and measure each input at its published site and by its published definition: ISO 8559-1 and ANSUR II for the body, Farkas for the head.
- Make every public parameter an anatomical measurement with a published definition, a unit and a population range, and replace a control without a definition, such as a blend slider, by the measure it stands for.
- Check an input against its definition and its population relations before relying on it, and correct a wrong input at the input.

## Evidence

- Read every difference from a reference or an earlier figure as evidence for or against a law.
- Fix every defect you find, whatever an earlier figure had.
- Use reference meshes and curves as observations for rules, and judge appearance against the original [photographs](screenshot.md#references).
- Check a law estimated from observed people on people outside its fit, and replace it with a published source when one is found, because an estimate reproduces the people it came from.
