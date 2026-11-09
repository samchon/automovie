# Source layout and runtime setup

Use this resource when placing source or tests, adding a subject, practice or scene, or adopting a host or integration.

## Source

One folder owns each responsibility, and the folders follow the chain from settings and research through the screenplay to the delivered film, so a module and the document it realizes pair by path. Each source folder answers the shared [development contracts](../contracts/development/SKILL.md) and its own.

| Location | Owns | Realizes, under |
| --- | --- | --- |
| `src/entities/<kind>/<subject>/`, with `<kind>` one of `cast`, `crowds`, `props`, `sets`, `cameras`, `lights` | One subject: its public entry class `<Subject>.ts` and the fragments it composes, such as body, look, rig, wardrobe, habits or affordances | Its settings record's facts, [entities](../contracts/development/entities.md) |
| `src/laws/<discipline>/` | Pure laws of a practice: shape priors, timing windows, reach, legality, outcome tables and variation ranges | `docs/research/<discipline>/`, [behaviors](../contracts/development/behaviors.md) |
| `src/interactions/<discipline>/` | Relations between entities by role: alignment, timing and rule-first outcomes, including how cameras and lights follow the action | Research and world rules, behaviors |
| `src/consequences/effects/`, `src/consequences/sound/` | What computed outcomes leave: sweat, scuffs, dust and other marks, and the effect cues a requested preview uses | Research, behaviors |
| `src/composition/scenes/<film>/<scene>/` | One screenplay scene's composition | That scene and its beats, [composition](../contracts/development/composition.md) |
| `src/composition/scenes/catalog/<case>/` | One isolated case played alone: a technique against a defense and outcome, a movement, an official or bystander behavior, a fall or an entity state the screenplay uses | The research section or settings fact it exhibits, composition |
| `src/composition/films/catalog.ts`, registered in `src/composition/films/index.ts` | The review catalog: every case in its own labelled interval with named review views; never delivered | Its cases' research and settings, composition |
| `src/composition/films/<film>.ts`, registered in `src/composition/films/index.ts` | One delivered video: scene order, transitions, titles and subtitles, grade, delivery profile and conditioning passes | The screenplay file, composition |
| `src/*.ts` | The Viewer host entry, the film interfaces and the film selector | Nothing |
| `src/executable/` | Node commands such as `render`, `review` and `physics` | Nothing |
| `src/integrations/<provider>/` | Provider or local-tool code; `render`, `viewer` and `recovery` ship with the scaffold: browser capture and FFmpeg export, MP4 probing, GLB export, process ownership and recovery file publication | The generation requests in `docs/prompts/` for providers |
| `test/features/<source path>/` | Logic unit tests of the source at the same path | Nothing |
| `public/` | Small fixed browser inputs; audio and video belong in [media](../production/media.md) | Nothing |
| Runtime `README.md` and `.env.example` | Nonsecret setup, commands, environment-variable names and example configuration | Nothing |
| Ignored local `.env` | Secret values required by adopted integrations | Nothing |

Settings domains map onto code: cast, crowds, props and sets become entities of the same kind, cinematography becomes camera and light entities, world rules become laws and interactions, and sound palettes become each shot's sound description in the video-diffusion prompt under [audio](../audio/SKILL.md). Weather and atmosphere are a set's state by story day, and ambience reads the same state. `<film>` is the screenplay file's name, such as `duet` or `001-episode`, and the same name reaches `media/automovie/<film>/`, so screenplay, scene, film and video pair by path. Rendered frames, videos and conditioning passes go there, never into `src`.

## How the parts work together

An entity is constructed from its settings facts and composes small fragments; its methods are capabilities that return intent records. A scene chains those capabilities in a sentence-like call such as `a.cue().lift(b).next(b.land()).with(c.turn())`, where the installed combinators place `next` in sequence and `with` in parallel; interactions then align the participants, derive timing from the laws and decide outcomes from the outcome tables, and consequences follow from those outcomes. The whole composition resolves once into a frozen schedule, and every film second is a pure function of that schedule. Each film has its own seed, and a film that continues another starts from that film's final state snapshots. Logic lives in pure laws the methods call, so a unit test needs no mock. The catalog and the screenplay films compose the same capabilities, so a case accepted in the catalog plays the same way in the film. This object shell over a functional core is the production's own style; installed packages keep theirs.

## Dependencies and files

Imports point down the chain: host and commands to films, films to scenes, scenes to consequences, interactions and entities, and every behavior down to laws and installed packages; tests may import any source folder. The production's `lint.config.ts` rejects an import against that direction, an import into a folder outside this table, and `Math.random`. A subject never imports another subject and a scene never imports another scene: an interaction relates subjects by role, and a film orders scenes. Viewer playback, transport, controls, inspection overlays, physics runtime and mixing serve every production, so they belong to installed packages such as `@automovie/engine`, `@automovie/viewer` or `@automovie/render`; a missing one is added there rather than grown as a production folder. Node-only tooling (processes, files, browser launch, FFmpeg) is not published: the production owns the scaffold-supplied copy in `src/integrations` and keeps it in step with the scaffold.

Each file exports one declaration named as the file and stays under 500 lines; a larger one is a responsibility to split into fragments. A new subject starts from its settings record, then its entity folder and tests; a new technique from its research, then its law and the interaction that uses it; a new scene from its screenplay H2 and beats, then its composition folder and its place in the film.

## Execution and runtime setup

Read the actual source entry, runtime configuration and installed APIs before adopting a host or integration, and record the choice and its authority in [project context](../production/profile.md); [finishing](../production/finishing.md) verifies playback and export on the assembled artifact.
