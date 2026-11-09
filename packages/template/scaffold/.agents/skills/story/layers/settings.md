# Settings

Write down everything about the world, its people, places and objects that later authors, artists and performers must keep true, specific enough to check and findable without reconstructing the world, under the settings questions in the [story contracts](../../contracts/story/SKILL.md). Settings are prose for readers; they never describe code. Read the [instructions](../planning/requirements.md#requirements) and finish [discovery](../planning/discovery.md) first, and work backward from the anticipated scenes to the facts they need. Baseline states belong here; the events that change or reveal them belong to [treatments](treatments.md) on the long route and to the screenplay on the short route.

## Records

Give each subject one file in its domain under the [document layout](../layout.md): one H1 naming the subject, an H2 per facet and an H3 per fact with an explicit anchor such as `{#hesitates-before-jumps}`. Later layers cite a fact by its file path and anchor, so never reuse or renumber one. Write each facet below, or `N/A` with its reason, because a missing facet and a deliberate omission must stay distinguishable.

| Domain | Facets |
| --- | --- |
| `world` | Rules of the world and of any practice shown, such as a sport's or ceremony's rules; time of day, weather and season defaults; tone |
| `cast` | Identity; body and model sheet, with the views and proportions that keep the subject recognizable; wardrobe, makeup and wounds by story day; carried props; movement style, named as Laban effort combinations such as direct, sudden and strong; repertoire and proficiency; habits, tells and mannerisms, each with what triggers it, how the body responds and how quickly and reliably it happens; speech, its lexicon, rhythm, tics and voice; values, worldview, super-objective and psychological gesture; relationships; knowledge; state changes over story time |
| `crowds` | Number, arrangement, makeup and what the crowd does, watches and reacts to throughout |
| `props` | Form, material and markings; how people hold, use or ride it; state changes; vehicles and animals included |
| `sets` | Shape, zones and landmarks with human-relative dimensions; routes, entrances and levels; dressing, practical lights and acoustics; how people use the space; state changes |
| `cinematography` | The look: lens kit, framing grammar, camera movement style, lighting style and grade |
| `sound` | Ambience and music palettes; voices belong to the cast |

User-fixed interpretations are canon. Research open facts through [research](../planning/research.md), attaching support and uncertainty to the facts they qualify, and report a conflict between an instruction and its source instead of changing canon. Embed a subject's canon images, generated under [image](../../image/SKILL.md), from `media/diffusion/images/<domain>/`, such as `![Mara, front](../../../../media/diffusion/images/cast/mara-front.png)` in `docs/body/settings/cast/mara.md`; when an image and the text disagree, repair whichever is wrong.

## Outline and changes

On the long route, keep `outline/index.md` as a finding guide: domain H2s and file H3s in reading order, each file entry anchored by its settings-relative path without `.md` and with `/` replaced by `--`, and each record citing its entry. Before splitting or moving records, map old addresses to their new owners and update links and consumers together under [customization](../../production/customization.md), keeping address migration separate from content changes; moved records keep the [closed-pass boundary](../correction/repair.md#closed-passes).

Settings has no separate expression pass: complete facts, explanation and organization in [construction](../workflow.md#construction).
