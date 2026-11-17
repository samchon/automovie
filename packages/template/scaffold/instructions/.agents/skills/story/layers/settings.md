# Settings

Settings record the decisions about the world, its people, places and objects that later authors, artists and performers must keep true, specific enough to hold the work to and findable without reconstructing the world, under the settings questions of the [story contracts](../../contracts/story/SKILL.md). They belong to the long route; a short writes its brief instead. Baseline states belong here, and the events that change or reveal them to [treatments](treatments.md).

Read the [instructions](../planning/requirements.md#requirements) and finish [discovery](../planning/discovery.md) first, then work backward from the anticipated scenes to the facts they need. Study what [when to study](../planning/research.md#when-to-study) assigns to settings, attaching support and uncertainty to the facts they qualify, and complete the facts, their explanation and their organization in the settings [pass](../workflow/long.md#each-layers-pass).

## Records

Give each subject one file in its domain under the [document layout](../document-layout.md#documents): one H1 naming the subject, an H2 per facet and an H3 per fact with an explicit anchor, such as `{#hesitates-before-jumps}`. Later layers cite a fact by its file path and anchor, which stays stable under [identities](notation.md#identities).

Write only the facets the planned scenes and arcs use, leaving an unused facet out, not marked `N/A`:

| Domain | Facets the scenes may need |
| --- | --- |
| `world` | Rules of the world and of any practice shown; time of day, weather and season defaults; tone |
| `cast` | The cast facets listed below |
| `crowds` | Makeup, arrangement and what the crowd does and reacts to |
| `props` | Form, material and markings; how people hold, use or ride it; state changes; vehicles and animals included |
| `sets` | Shape, zones and landmarks; routes, entrances and levels; dressing; how people use the space; state changes |
| `cinematography` | Framing grammar and camera movement style, and the film's look |
| `sound` | Ambience and music palettes; voices belong to the cast |

A practice shown is, for example, a sport or a ceremony. The film's look is its medium or rendering style, lighting style, lens character and grade.

The work's scope record links the adopted representation in `PROJECT.md` and states what it cannot show. Measurements such as dimensions and timings stay out of records except as the [usable-facts question](../../contracts/story/shared/principles/settings.md#usable-facts) allows.

User-fixed interpretations are canon: report a conflict between an instruction and its source instead of changing canon. Where a commission uses canon references, made under [canon references](../../image/canon-references.md), embed a subject's from `media/diffusion/images/<domain>/`, such as `![Mara, front](../../../../media/diffusion/images/cast/mara-front.png)` in `docs/body/settings/cast/mara.md`, and when an image and the text disagree, repair whichever is wrong.

### Cast facets

A cast member's record may need these facets:

- identity;
- the body facts a polygon man's parameters derive from, and canon references;
- wardrobe, makeup and wounds by story day;
- carried props;
- movement style;
- repertoire and proficiency;
- habits and tells, each with its trigger and response;
- speech and voice;
- values, worldview and motives;
- relationships;
- knowledge;
- state changes over story time.

## Outline and changes

Keep `outline/index.md` as a finding guide: domain H2s and file H3s in reading order, each file entry anchored by its settings-relative path without `.md` and with `/` replaced by `--`, and each record citing its entry.

Keep settings current as a continuity record. When a treatment, script or screenplay establishes a lasting state that later units or code must keep, such as a wound or a revealed relationship, add it in the same repair as a new anchored fact in its subject's state facet, citing the establishing unit. A new fact follows [closed passes](../correction/repair.md#closed-passes) and leaves existing judgments in place.

Before splitting or moving records, map old addresses to their new owners and update links and consumers together under [reorganization](../../production/reorganization.md), keeping address migration separate from content changes. Moved records also follow closed passes.
