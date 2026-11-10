# Document layout and supplied material

Use this resource when choosing where a creative document, its evidence or its review goes, or when taking over existing work. These are default locations, not a request to create empty trees. The evidence and review locations below are the installed evidence package's defaults, and its documentation owns supported layouts and selectors. This table is the one place the skills show them; [evidence configuration](../evidence/configuration.md) owns their use.

## Documents

Commit instructions, creative bodies and evidence answers. Review, naturalness and revision working records stay local. Keep one current record per purpose, identified by its actual inputs; Git preserves earlier tracked editions. Raw logs, classification tables, run records and temporary comparisons belong in ignored `.cache/`, with their relevant conclusions in the current record.

| Location, when used | Owns |
| --- | --- |
| `docs/instructions/*.md` | Creative requirements, source boundaries and identified delegated writing choices |
| `docs/body/settings/<domain>/<subject>.md` | One subject's facts, one file per subject, with H2 facets and anchored H3 facts, in the domains `world`, `cast`, `crowds`, `props`, `sets`, `cinematography` and `sound` |
| `docs/body/settings/outline/index.md` | Domain and file navigation without duplicating facts |
| `docs/body/brief/<domain>/<subject>.md` | A short's shared decisions in the settings domains, with its fixed conditions in `world/work.md` |
| `docs/body/treatments/NNN-event.md` | Flat ordered events, causes, consequences, and information release |
| `docs/body/scripts/NNN-part/NNN-episode.md` | Executable scenes and release partition, with part indexes |
| `docs/body/screenplay/<film>.md`, or `NNN-part/NNN-episode.md` for several videos | Complete final audiovisual text, one file per delivered video, from whose path the [film name](../development/layout.md#source) derives; long work preserves its script partition |
| `docs/research/index.md`, `docs/research/<discipline>/<topic>.md` | The source index and the studies of each practice and style: laws, outcome tables and measurable targets, under [research](planning/research.md) |
| `references/`, ignored `references/private/` | Retained research originals: permitted copies, and those whose rights are unconfirmed |
| `docs/contracts/work/...`, `docs/contracts/language/...` | This production's own story contracts supplementing the shared ones, cited as `work/...` and `language/...`; discovery writes `work/discovery/results.md` |
| `docs/acceptance/<film>.md` | The film's tracked acceptance record, and in `catalog.md` the catalog's accepted cases, under [delivery review](../review/delivery.md#acceptance-record) |
| `docs/evidence/construction/{units,files}/<layer>/...` | Separate construction answers for units and whole files, including `files/research/` for the research studies |
| Ignored `docs/review/{draft,final}/<layer>/<relative-file>.md` | Current independent unit reviews mirroring the actual body or working edition |
| Ignored `docs/review/{draft,final}/<layer>/verdict/index.md` | Current complete-population verdict, findings and author decisions |
| Ignored `docs/naturalness/`, `docs/revision/` | Frozen and working screenplay editions retained while their cycle needs them |

Project context lives in [PROJECT.md](../production/profile.md) and generation requests under [media](../production/media.md).

A part can be an act, release block, or another division suited to the format. An episode file can hold a suitable sequence in a continuous film; its filename does not force an episodic release. Narrative partition and [source organization](../development/layout.md) are separate choices.

## Intake of existing work

Identify supplied settings, scripts or completed works by their original source revision or retained reference. Through [instructions](planning/requirements.md#requirements), record their identity, adopted requirements, fixed quotations, and reinterpretation boundaries. Existing finished work supplies material and choices to assess; it does not approve this production's layers.
