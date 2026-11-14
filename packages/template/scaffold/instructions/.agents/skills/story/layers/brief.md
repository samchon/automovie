# Brief

A short's canon: the few decisions its screenplay cites, under the brief questions in the [story contracts](../../contracts/story/SKILL.md). It is prose for readers and never describes code.

Write it after [discovery](../planning/discovery.md), studying what [when to study](../planning/research.md#when-to-study) assigns it.

## What it holds

Hold only what the [needed-decisions statements](../../contracts/story/shared/statements/principles/brief.md#needed-decisions) list: the decisions about the people, places and recurring props that several scenes must keep true, and, for a commissioned generated film, the film's look, because every generation request repeats it. Everything else, such as a person or object only one scene shows, each shot's camera and the sound, is decided in the screenplay, which code then cites, because a brief decision binds every scene that cites it.

## Records

Give each subject one file in its domain, `docs/body/brief/<domain>/<subject>.md`, in the settings domain of its kind: `cast` for people, `sets` for places, `props` for recurring props, and the film's look in `docs/body/brief/cinematography/look.md`. Each file has one H1 naming the subject or the look, an H2 per facet and an H3 per decision with an explicit anchor; the screenplay cites a decision by its path and anchor, so never reuse or renumber one.

Keep measurements out, under the [settings rule](settings.md#records). User-fixed interpretations are canon; report a conflict between an instruction and its source instead of changing it.

For a commissioned generated film or detail option, embed a subject's canon references, generated under [image](../../image/SKILL.md), from `media/diffusion/images/<domain>/`, as [settings](settings.md#records) records do.

## Growth

The brief grows as the screenplay is written, as a series bible does. After the pass closes, a decision of a kind the brief holds that one scene makes and another must keep is added under [concretization](../correction/repair.md#concretization).
