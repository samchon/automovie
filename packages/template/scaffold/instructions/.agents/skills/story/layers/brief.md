# Brief

A short's minimal canon, written once and cited by the screenplay, under the brief questions in the [story contracts](../../contracts/story/SKILL.md). The brief is prose for readers and never describes code.

Write it after [discovery](../planning/discovery.md), studying under [when to study](../planning/research.md#when-to-study).

## What it holds {#what-it-holds}

Hold only what the [needed-decisions statements](../../contracts/story/shared/statements/principles/brief.md#needed-decisions) list: the few decisions about the people, places and recurring props that several scenes must keep true. Everything else, such as a person or object only one scene shows, the camera and the sound, is decided in the screenplay and cited from there, because a brief decision binds every scene that cites it.

## Records

Give each subject one file in its domain, `docs/body/brief/<domain>/<subject>.md`, in a settings domain such as `cast`, `props` or `sets`; use only the domains the subjects need. Each file has one H1 naming the subject, an H2 per facet and an H3 per decision with an explicit anchor; the screenplay cites a decision by its path and anchor, so never reuse or renumber one.

Keep measurements out, under the [settings rule](settings.md#records). User-fixed interpretations are canon; report a conflict between an instruction and its source instead of changing it.

Embed a subject's canon images, generated under [image](../../image/SKILL.md), from `media/diffusion/images/<domain>/`, as [settings](settings.md#records) records do.

## Growth

The brief grows from writing, as a series bible does, first while the screenplay is drafted under the [short route](../workflow/short.md#steps). After the pass closes, a decision of a kind the brief [holds](#what-it-holds) that one scene made and another scene or film must keep is added here as a new anchored decision citing the establishing scene, under [closed passes](../correction/repair.md#closed-passes).
