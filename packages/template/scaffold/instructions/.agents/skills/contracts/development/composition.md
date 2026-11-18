# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). What it cites depends on what it composes:

| Declaration | Cites |
| --- | --- |
| A scene in `src/composition/scenes/<film>/<scene>/` | Its screenplay scene file, or each section and beat of it |
| A film in `src/composition/films/<film>.ts` | Each scene file of its folder, in the order it plays them |
| A catalog case in `src/composition/scenes/catalog/<module>/` | What it exhibits, named in prose |
| The catalog film | What each of its cases exhibits, named in prose |

Cite a beat or section as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`. Omit the anchor for a whole file. In a catalog answer, cite the exhibited fact or study section in prose.

Without narrative passes, scenes and films also cite the instructions they realize. Ask the user to add missing scene files or section or beat headings to a fixed screenplay before citing it.

Every section, beat and scene file is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it, or on the film when a whole scene file is omitted.

Statements: [statements/composition.md](statements/composition.md).

## Screenplay realization

Does each scene realize every cited beat as written, and does the film play every scene in screenplay order at the recorded delivery profile?

State the beats realized and what happens in them, each decision the code had to make where the screenplay was vague, and where the screenplay now records it.

## Composition only

Does the declaration compose only accepted module capabilities using installed operators and the screenplay's decisions?

State the capabilities it combines and where it places absolute time.

## Living scene

Does the scene perform each presence throughout its interval, preserve the beats' movement and camera decisions and aim at the study's visible and audible targets where applicable?

State each presence's behavior, the spatial changes and the targets the scene aims at.
