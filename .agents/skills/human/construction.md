# Construction

## Form

- Build both sides through one canonical construction and a declared reflection, including boundary maps, derivatives and orientation.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, joined to its neighbours by a declared composition rule. Keep common mathematics in one shared module, and give each shared boundary one owner that its neighbour copies.
- Loft a limb on its bone: stations along the bone axis and sections square to it. Horizontal sections cut a slanted limb obliquely.
- Emit `IAutoMovieHumanLoftChain` under the existing chain names, so the body surface, event joins, skin, appearance and construction keep working unchanged.
- Change the section representation only when a part shows the existing one cannot carry the law: each new representation spreads into joins, caps, normals and sampling.
- Make skin smooth through its generating mathematics, with no smoothing pass, clamp, threshold or exclusion after construction.
- Keep full skin, the generation path, rigs, export and other consumers working at every commit. Empty or unavailable output is a regression.
- Leave genitals and nipples out of the modelled skin.

## Numbers

- Reduce independent numbers, never curves. Keep curve and section density at or above the current figure; sparse keys and fixed low control counts lose anatomy.
- A small shape prior is allowed when the anatomy needs it: named constants in normalized part coordinates, shared by every person. A table per person, row or side is not, and moving or compressing a table is not replacing it. A stored person's rows deformed by a transform is not a construction.
- Give every constant a published source, a population measurement or a derivation. A hand-set value identical across features is a sign that a rule is missing.
- A fitted prior inherits the inputs and definitions it was fitted to. When either changes, replace the prior by the definition and solve the measure against the construction's own surface instead of refitting.

## Inputs

- Construct and measure each input at its published site and by its published definition: ISO 8559-1 and ANSUR II for the body, Farkas for the head, limb sections square to the bone axis. A construction that places a tape by its own convention only measures that convention back, so its misses stay invisible.
- Check an input against its documented definition and its population relations before relying on it. Inputs taken between rig joints or at stand-in landmarks are far off their definitions.
- Never tune the construction to an input: a factor that absorbs a wrong input becomes an error once the input is measured correctly.

## Evidence

- Treat every difference from a reference or from an earlier figure as evidence, never as a target. A large held-out error can reject a law; correcting a coefficient to shrink it is overfitting.
- Do not carry a defect over from an earlier figure because it was there.
- Use reference meshes and curves as observations for rules, judge appearance against the original [photographs](screenshot.md#references), and never treat a reverse-render artifact such as ruled striping or cracks as an anatomical target.
- Claim no common law or prediction for other people from one person's reproduction.
