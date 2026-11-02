# Construction

## Form

- Build both sides through one canonical construction and a declared reflection, including boundary maps, derivatives and orientation.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, joined to its neighbours by a declared composition rule. Keep common mathematics in one shared module, and give each shared boundary one owner that its neighbour copies.
- Loft each limb and digit on its own bone.
- Emit `IAutoMovieHumanLoftChain` under the existing chain names, so the body surface, event joins, skin, appearance and construction keep working.
- Change the section representation only when a part shows the existing one cannot carry the law; a new representation spreads into joins, caps, normals and sampling.
- Make skin smooth through its generating mathematics, with no smoothing pass, clamp, threshold or exclusion after construction.
- Keep full skin, the generation path, rigs, export and other consumers working at every commit.
- Leave genitals and nipples out of the modelled skin.

## Numbers

- Reduce independent numbers, never curves. Keep curve and section density at or above the current figure; sparse keys and low control counts lose anatomy.
- A small shape prior is allowed: named constants in normalized part coordinates, shared by every person. A table per person, row or side is not, nor is a moved, compressed or deformed table.
- Give every constant a published source, a population measurement or a derivation. A hand-set value repeated across features means a rule is missing.
- A fitted prior inherits the inputs and definitions it was fitted to. When either changes, replace the prior by the definition and solve the measure against the construction's own surface.

## Inputs

- Construct and measure each input at its published site and by its published definition: ISO 8559-1 and ANSUR II for the body, Farkas for the head.
- Check an input against its definition and its population relations before relying on it, and never tune the construction to it.

## Evidence

- Treat every difference from a reference or an earlier figure as evidence, never as a target. A large held-out error can reject a law; correcting a coefficient to shrink it is overfitting.
- Do not keep a defect because an earlier figure had it.
- Use reference meshes and curves as observations for rules, judge appearance against the original [photographs](screenshot.md#references), and never treat a reverse-render artifact such as ruled striping or cracks as anatomy.
- Claim no law for other people from one person's reproduction.
