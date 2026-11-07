# Settings

Write the film's requirements specification: everything later authors, artists, performers and code must realize, findable and checkable without reconstructing the world, under the settings questions in the [story contracts](../../contracts/story/SKILL.md). Read the [instructions](../planning/requirements.md#requirements) and finish [discovery](../planning/discovery.md) first, and work backward from the anticipated scenes to the requirements they need. Baseline states belong here; the events that change or reveal them belong to [treatments](treatments.md) on the long route and to the screenplay on the short route.

## Records

Give each subject one file in its domain under the [document layout](../layout.md): one H1 naming the subject, an H2 per facet and an H3 per requirement with an explicit anchor such as `{#hab-drops-left-arm}`. A requirement's address is its file path and anchor, cited by the screenplay's beats and the code's declarations, so never reuse or renumber one. Each facet below is written or answered `N/A` with its reason, because a missing facet and a deliberate omission must stay distinguishable.

| Domain | Facets |
| --- | --- |
| `world` | Rules of the world and of any practice shown, such as a sport's ruleset and its legal targets; time of day, weather and season defaults; tone |
| `cast` | Identity; body and model sheet, the views and proportions an on-model check compares; wardrobe, makeup and wounds by story day; carried props; movement style as named Laban effort combinations such as direct, sudden and strong; repertoire and proficiency, with the subject's parameters for each research law; habits, tells and mannerisms, each a trigger, response and reaction class; speech, its lexicon, rhythm, tics and voice; values, worldview, super-objective and each scene's objective with its psychological gesture; relationships; knowledge state; state variants and continuity |
| `crowds` | Count, layout, composition and role behavior: what the crowd does, watches and reacts to |
| `props` | Form, material and markings; affordances, the slots and relations through which others use it; state variants; vehicles and animals included |
| `sets` | Geometry, zones and landmarks with human-relative dimensions; routes, entrances and levels; dressing, practical lights and acoustics; affordances; state variants |
| `cinematography` | The look: lens kit, framing grammar, camera movement style, lighting style and grade |
| `sound` | Ambience and music palettes; voices belong to the cast |

A practiced activity's performer, official or partner records its repertoire and habits from the [research](../planning/research.md), so the screenplay and code realize a studied practice rather than invent one. User-fixed interpretations are canon. Research open facts, attaching support and uncertainty to the requirements they qualify, and report a conflict between an instruction and its source instead of changing canon. Rendering controls belong to the code; an implementation choice becomes a requirement only through an adopted decision.

## Realized entities {#realized-entities}

A record whose subject appears on screen links what realizes it, so a reader and a reviewer see the subject beside the requirements it must meet: from `docs/body/settings/cast/fighter-a.md`, embed `![Fighter A, front](../../../../media/diffusion/images/cast/fighter-a-front.png)` and, once it exists, link `[Fighter A entity](../../../../src/entities/cast/fighter-a/)`. When the image or entity and the record disagree, repair whichever is wrong; a link never changes a requirement.

## Outline and changes

On the long route, keep `outline/index.md` as a finding guide: domain H2s and file H3s in reading order, each file entry anchored by its settings-relative path without `.md` and with `/` replaced by `--`, and each record citing its entry. Before splitting or moving records, map old addresses to their new owners and update links and consumers together under [customization](../../production/customization.md), keeping address migration separate from content changes; moved records keep the [closed-pass boundary](../correction/repair.md#closed-passes).

Settings has no separate expression pass: complete requirements, explanation and organization in [construction](../workflow.md#construction).
