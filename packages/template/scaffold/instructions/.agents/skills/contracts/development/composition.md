# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). What it cites depends on what it composes:

| Declaration | Cites |
| --- | --- |
| A scene in `src/composition/scenes/<film>/<scene>/` | Its screenplay scene file, or each section and beat of it |
| A film in `src/composition/films/<film>.ts` | Each scene file of its folder, in the order it plays them |
| A catalog case in `src/composition/scenes/catalog/<module>/` | What it exhibits, named in prose |
| The catalog film | What each of its cases exhibits, named in prose |

A scene writes each citation as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`, omitting the anchor to cite the whole file. A catalog case names the settings or brief fact or the study section it exhibits in its answer's prose, with no `@evidence` tag to it.

When no narrative pass runs, scenes and films also cite the instruction sections they realize. A fixed screenplay without scene files and section or beat headings goes back to the user to add them, because scenes cite them.

Every section, beat and scene file is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it, or on the film when a whole scene file is omitted.

Statements: [statements/composition.md](statements/composition.md).

## Screenplay realization

Does the scene compose every decision of the beats it cites, without omitting, altering or adding to them, and does a film play every scene as the screenplay orders it, at the delivery profile the production records? The screenplay is the last place a decision is made, so a choice made in code leaves the screenplay and the film disagreeing.

State the beats realized and what happens in them, each decision the code had to make where the screenplay was vague, and where the screenplay now records it.

## Composition only

Does the declaration only combine the capabilities of accepted modules, through the installed packages' operators, along the screenplay? Logic written into one scene cannot be reused, tested or accepted in a catalog case, so anything else found here is a capability missing from its owner.

State the capabilities it combines and where it places absolute time.

## Living scene

Does everyone and everything on screen perform its role for its whole presence, move through the set as the beats decide, and aim at the measurable targets a study set, where one did, for what a viewer sees and hears? A scene of isolated single actions, an idle participant or an unmotivated static camera shows the audience a rehearsal instead of the practice.

State each presence's behavior, the spatial changes and the targets the scene aims at.
