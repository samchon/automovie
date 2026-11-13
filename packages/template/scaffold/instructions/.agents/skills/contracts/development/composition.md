# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md).

A scene in `src/composition/scenes/<film>/<scene>/` realizes one screenplay scene file and cites it, or each of its sections and beats, as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`, the anchor omitted for the whole file. A film in `src/composition/films/<film>.ts` cites each scene file of its folder in the order it plays them. When [no narrative pass runs](../../story/workflow/SKILL.md#who-writes-the-screenplay), scenes and films also cite the instruction sections they realize. A fixed screenplay without scene files and section or beat headings goes back to the user to add them, because scenes cite them.

Every section, beat and scene file is realized, and an `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it, or on the film when a whole scene file is omitted.

A catalog case in `src/composition/scenes/catalog/<module>/` and the catalog film cite the research section or settings or brief fact each case exhibits in place of a screenplay, and answer the other items.

Statements: [statements/composition.md](statements/composition.md).

## Does it realize every screenplay decision it cites? {#screenplay-realization}

Does the scene compose every decision of the beats it cites, without omitting, altering or adding to them, and does a film play every scene as the screenplay orders it, at the delivery profile the production records? The screenplay is the last place a decision is made, so a choice made in code leaves the screenplay and the film disagreeing.

State the beats realized and what happens in them, each decision the code had to make where the screenplay was vague, and where the screenplay now records it.

## Does it only compose? {#composition-only}

Does the declaration only combine the capabilities of accepted modules, through the installed packages' operators, along the screenplay? Logic written into one scene cannot be reused, tested or accepted in a catalog case, so anything else found here is a capability missing from its owner.

State the capabilities it combines and where it places absolute time.

## Is every presence alive and every target reached? {#living-scene}

Does everyone and everything on screen perform its role for its whole presence, move through the set as the beats decide, and aim at the research's measurable targets for what a viewer sees and hears? A scene of isolated single actions, an idle participant or an unmotivated static camera shows the audience a rehearsal instead of the practice.

State each presence's behavior, the spatial changes and the targets the scene aims at.
