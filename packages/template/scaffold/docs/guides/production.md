# Production workflow

The requested result decides the workflow. These paths are conventions for a new production, not a file schema or required folder tree. Keep an existing layout that works and create only what the task uses.

## Choose the working path

| Result | Smallest useful path |
| --- | --- |
| Standalone model or motion | Required appearance and controls → asset source → observed model or animation → handoff |
| Short video with a clear idea | Final video script → assets, sound, and shot source → assembled video |
| Long film or series | Brief → shared facts and event design where needed → screenplay → shots, sound, and edit → assembled film or episodes |

A clear request can be the brief; record its constraints at the top of the script rather than creating another document. For a larger work, `docs/brief.md` can own audience, form, duration, visual language, budget, delivery format, and decisions still awaiting the user. Preserve explicit user choices.

Before multiplying scenes or assets, prove a representative production path with the chosen packages and host. Identify missing capabilities early. A preliminary frame, silent animatic, or placeholder voice is a named intermediate, not the requested finished video.

## Keep each decision with its owner

| Location, when needed | Owns |
| --- | --- |
| `docs/world/` | Shared facts and constraints that several scenes depend on |
| `docs/story/` | Event progression, information release, episode or act boundaries |
| `docs/scripts/`, or one `docs/script.md` | Final audiovisual screenplay |
| `docs/edit/` | Script-to-shot mapping, sequence decisions, timing and continuity |
| `src/assets/` | Production-owned models, rigs, controls, and their reusable parameters |
| `src/shots/` | Staging, performance, and camera choices for executable shots |
| `src/film/` | Ordered edit, sound and caption placement, delivery entries |
| `public/` | Retained media and browser static inputs |
| `docs/review/` | Observations, source/output identities, limitations, and review findings |

A small production can combine source roles in one entry. Split them when independent changes or reuse justify it. Do not create empty registries, wrappers, or a configuration framework to imitate this table. Keep code controls typed and local; a directory name alone does not connect source to the edit.

Keep creative intent separate from executable decisions without duplicating facts. A script owns what the audience must see and hear; shot code owns how it is staged, and the edit owns which built shots are delivered. Mark provisional timing until measured sound and playback establish it.

## Customize the project

The installed `AGENTS.md`, skills, guides, package commands, compiler settings, and evidence configuration belong to this production. Adapt them to its language, naming, pipeline, providers, and delivery needs. Package upgrades do not migrate these files.

Keep universal routing in `AGENTS.md`, goals and boundaries in skills, and optional operating detail in these guides. Add a new skill for a task with its own trigger, not for each scene or provider. Keep API usage in installed package documentation and working consumers.

If paths change, update imports, command entries, evidence populations, and document links in the same change. Record the chosen source entry, viewer or render host, package commands, fixed media locations, and output location once they exist. The blank scaffold supplies no viewer or render command; choose and wire them for the actual deliverable rather than documenting a fictional runner.

## Evidence and completion

Use [contracts](contracts.md) to decide which relationships need mechanical coverage. Short works can use a small script-to-shot map and direct playback review; long works often need graph coverage as well. In either case, a program mentioning a script is not proof that its output realizes it.

When a source fact, event, asset, voice take, or edit changes, identify the affected descendants and revisit their timing, evidence, and observations together. Review the requested whole at delivery; a pilot or a collection of locally passing units does not cover material that was never produced.
