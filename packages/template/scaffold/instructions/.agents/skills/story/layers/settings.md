# Settings

Write down the decisions about the world, its people, places and objects that later authors, artists and performers must keep true, specific enough to hold the work to and findable without reconstructing the world, under the settings questions in the [story contracts](../../contracts/story/SKILL.md). Settings are prose for readers; they never describe code.

Read the [instructions](../planning/requirements.md#requirements) and finish [discovery](../planning/discovery.md) first, and work backward from the anticipated scenes to the facts they need.

Settings belong to the long route; a short writes its [brief](brief.md) instead. Baseline states belong here; the events that change or reveal them belong to [treatments](treatments.md).

## Records

Give each subject one file in its domain under the [document layout](../document-layout.md): one H1 naming the subject, an H2 per facet and an H3 per fact with an explicit anchor such as `{#hesitates-before-jumps}`. Later layers cite a fact by its file path and anchor, so never reuse or renumber one.

Write only the facets the planned scenes and arcs use; an unused facet is left out rather than marked `N/A`, and a dimension the commission excludes is excluded once in the work's scope record, which also states the adopted representation and what it cannot show.

Measurements such as dimensions, light positions and timings go to [research](../planning/research.md) for their sources and to code for their values, unless the value is itself a story decision.

| Domain | Facets the scenes may need |
| --- | --- |
| `world` | Rules of the world and of any practice shown, such as a sport's or ceremony's rules; time of day, weather and season defaults; tone |
| `cast` | Identity; the body facts a polygon man's parameters derive from, and canon images; wardrobe, makeup and wounds by story day; carried props; movement style; repertoire and proficiency; habits and tells, each with its trigger and response; speech and voice; values, worldview and motives; relationships; knowledge; state changes over story time |
| `crowds` | Makeup, arrangement and what the crowd does and reacts to |
| `props` | Form, material and markings; how people hold, use or ride it; state changes; vehicles and animals included |
| `sets` | Shape, zones and landmarks; routes, entrances and levels; dressing; how people use the space; state changes |
| `cinematography` | The look: framing grammar, camera movement style, lighting style and grade |
| `sound` | Ambience and music palettes; voices belong to the cast |

User-fixed interpretations are canon. Research open facts through [research](../planning/research.md), attaching support and uncertainty to the facts they qualify, and report a conflict between an instruction and its source instead of changing canon.

Embed a subject's canon images, generated under [image](../../image/SKILL.md), from `media/diffusion/images/<domain>/`, such as `![Mara, front](../../../../media/diffusion/images/cast/mara-front.png)` in `docs/body/settings/cast/mara.md`; when an image and the text disagree, repair whichever is wrong.

## Outline and changes

Keep `outline/index.md` as a finding guide: domain H2s and file H3s in reading order, each file entry anchored by its settings-relative path without `.md` and with `/` replaced by `--`, and each record citing its entry.

Before splitting or moving records, map old addresses to their new owners and update links and consumers together under [sync and reorganization](../../production/sync-and-reorganization.md), keeping address migration separate from content changes; moved records keep the [closed-pass boundary](../correction/repair.md#closed-passes).

Keep settings current as a continuity record: when a treatment, script or screenplay establishes a lasting state that later units or code must keep, such as a wound, a learned habit or a revealed relationship, add it as a new anchored fact in its subject's state facet, citing the establishing unit, in the same repair. A new fact receives its own answers and review under [closed passes](../correction/repair.md#closed-passes) and leaves existing judgments in place.

Complete the facts, their explanation and their organization in [construction](../workflow.md#construction).
