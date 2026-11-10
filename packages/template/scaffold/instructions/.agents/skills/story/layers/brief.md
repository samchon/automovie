# Brief

A short's canon: the decisions its screenplays must keep true, written once and cited by every film, under the brief questions in the [story contracts](../../contracts/story/SKILL.md). The brief is prose for readers and never describes code.

Read the [instructions](../planning/requirements.md#requirements) and finish [discovery](../planning/discovery.md) first, research every practice the films show through [research](../planning/research.md), and work backward from the planned films to the decisions they need.

## Records

Give each subject one file in its domain, `docs/body/brief/<domain>/<subject>.md`, in the settings domains `world`, `cast`, `crowds`, `props`, `sets`, `cinematography` and `sound`.

Keep the work's fixed conditions in `docs/body/brief/world/work.md`:

- each film's running time and frame, in agreement with the [delivery profile](../../production/project-context.md);
- the adopted representation and what it cannot show;
- one line per film.

Each file has one H1 naming the subject, an H2 per facet and an H3 per decision with an explicit anchor; screenplays cite a decision by its path and anchor, so never reuse or renumber one.

Write only the facets the planned films use, and leave measurements to research and code unless the value is itself a story decision.

User-fixed interpretations are canon; report a conflict between an instruction and its source instead of changing it.

Embed a subject's canon images, generated under [image](../../image/SKILL.md), from `media/diffusion/images/<domain>/`, as [settings](settings.md#records) records do.

## Growth

The brief grows from writing, as a series bible does. When a screenplay finds a brief decision missing, contradictory or unrealizable, repair the brief before writing from it under [upstream repair](../correction/repair.md#upstream-defects). When a decision one screenplay made must hold in another scene or film, add it here as a new anchored decision citing the establishing unit, under [closed passes](../correction/repair.md#closed-passes).

The brief has no separate expression pass: complete its decisions, explanation and organization in [construction](../workflow.md#construction).
