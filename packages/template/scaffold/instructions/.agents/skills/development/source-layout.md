# Source layout

This document says where source, tests and runtime setup belong, and where a new subject, practice, scene, host or integration goes.

## Source {#source}

One folder owns each responsibility, and the folders follow the chain from settings or brief and research through the screenplay to the delivered film, so a module and the document it realizes pair by path. Each source folder answers the shared [development contracts](../contracts/development/SKILL.md) and its own.

| Location | Owns | Realizes, under |
| --- | --- | --- |
| `src/entities/<kind>/<subject>/`, with `<kind>` one of `cast`, `crowds`, `props`, `sets`, `cameras`, `lights` | One subject: its public entry class `<Subject>.ts` and the fragments it composes, such as body, look, rig, wardrobe, habits or affordances | Its settings or brief record's facts and the research its measurements follow, [entities](../contracts/development/entities.md) |
| `src/laws/<discipline>/` | Pure laws of a practice the installed packages do not carry: the rows and laws [extend](../motion/extend.md) registers with the motion vocabulary, the laws of what is not a person, and legality, outcome tables and variation ranges | `docs/research/<discipline>/`, [behaviors](../contracts/development/behaviors.md) |
| `src/interactions/<discipline>/` | Relations between entities by role: alignment, timing and rule-first outcomes, including how cameras and lights follow the action | Research and world rules, behaviors |
| `src/consequences/effects/`, `src/consequences/sound/` | What computed outcomes leave: sweat, scuffs, dust and other marks, and the effect cues a preview or commissioned soundtrack uses | Research, behaviors |
| `src/composition/scenes/<film>/<scene>/` | One screenplay scene's composition | That scene and its beats, [composition](../contracts/development/composition.md) |
| `src/composition/scenes/catalog/<module>/` | One module's [catalog case](../motion/catalog-cases.md) composition, which takes the case parameters: the action with its target, partner response and outcome, the movement, the behavior, the fall or the entity state | The research section or settings or brief fact it exhibits, composition |
| `src/composition/films/catalog.ts`, registered in `src/composition/films/index.ts` | The review catalog: every case the screenplay uses, in its own labeled interval with named review views; never delivered | Its cases' research and settings or brief, composition |
| `src/composition/films/<film>.ts`, registered in `src/composition/films/index.ts` | One delivered video: scene order, transitions, titles and subtitles, grade, the [delivery profile](../production/project-context.md) and control channels | The screenplay file, composition |
| `src/*.ts` | The inspector and draw pages' entries, the subjects module, the film interfaces and the film selector | Nothing |
| `src/executable/` | The Node commands the README documents and the Node tooling they run, shipped with the scaffold | Nothing |
| `src/integrations/<provider>/` | Code for a provider or local tool the production adopts, such as a video-generation service | The generation requests in `docs/prompts/` for providers |
| `test/features/<source path>/` | Logic unit tests of the source at the same path | Nothing |
| `public/` | Small fixed browser inputs; audio and video belong in [media records](../production/media-records.md) | Nothing |
| Runtime `README.md` and `.env.example` | Nonsecret setup, commands, environment-variable names and example configuration | Nothing |
| Ignored local `.env` | Secret values required by adopted integrations | Nothing |

Settings or brief domains map onto code: cast, crowds, props and sets become entities of the same kind, cinematography becomes camera and light entities, world rules become laws and interactions, and sound palettes become each shot's sound description in the video-diffusion prompt under [audio](../audio/SKILL.md). Weather and atmosphere are a set's state by story day, and ambience reads the same state.

`<film>` is the screenplay file's path under `docs/body/screenplay/` without `.md`, with `/` replaced by `--`, such as `duet` or `001-part--001-episode`. The same name reaches `media/automovie/<film>/`, so screenplay, scene, film and video pair by path and two parts' episodes cannot collide. Rendered frames, videos and control channels go to [media records](../production/media-records.md), never into `src`.

## How the parts work together {#how-the-parts-work-together}

An entity is constructed from its settings or brief facts and composes small fragments. Its methods are capabilities that return intent records: what the subject means to do and to whom, never a pose, a coordinate or a time.

A person's capability carries the installed motion vocabulary. Its intent is the vocabulary's own [composition](../motion/compose.md) of that action, built with the body prepared for the cast member, the proficiency the cast record gives and the targets the scene passes, as the vocabulary's README shows. The entity adds no motion of its own. The vocabulary performs an action the production [registers](../motion/extend.md) like one of its own, so it reaches a scene the same way.

A scene joins capabilities through the operators of the installed motion vocabulary and engine, as their READMEs show. Interactions then align the participants, derive timing from the laws and decide outcomes from the outcome tables, and consequences follow from those outcomes. Logic lives in pure laws the methods call, so a unit test needs no mock.

The whole composition resolves once per film into a frozen schedule, and every film second is a pure function of that schedule. Each film has one seed, and every seeded stream derives from it, the motion vocabulary's included, so reseeding a film reseeds every performer together. A film that continues another starts from that film's final state snapshots.

A film only composes: the catalog and the screenplay films call the same capabilities with the same kind of parameters, so a case accepted in the catalog plays the same way in the film. The [composition contract](../contracts/development/composition.md#composition-only) holds every scene to this.

The object shell over a functional core is the production's own style; installed packages keep theirs.

## Dependencies and files

Imports point down the chain: host and commands to films, films to scenes, scenes to consequences, interactions and entities, and every behavior down to laws and installed packages; tests may import any source folder. An import against that direction or into a folder outside the table is a layout defect that review rejects. Lint stays generic and rejects `Math.random` everywhere.

A subject never imports another subject and a scene never imports another scene: an interaction relates subjects by role, and a film orders scenes.

What serves every production belongs to the installed packages and never grows as a production folder; a missing capability follows [installed packages](reuse.md#installed-packages).

Node-only tooling (processes, files, browser launch, FFmpeg) is not published: the production owns the scaffold-supplied copy under `src/executable` and keeps it in step with the scaffold.

Each file exports one declaration named as the file and stays under 500 lines; a larger one is a responsibility to split into fragments.

A new subject starts from its settings or brief record, then its entity folder and tests. A new action starts from the installed motion vocabulary. Only when [extend](../motion/extend.md) finds the vocabulary lacks it does it start from its research, then its registered row or law and the interaction that uses it. A new scene starts from its screenplay H2 and beats, then its composition folder and its place in the film.

## Shared modules {#shared-modules}

A module a second production of the workspace needs moves to a workspace package under `packages/<name>` and is imported by both, because a copied entity or law is a [copied variant](reuse.md#one-module) at workspace scale.

The shared module takes what differed between the productions as constructor input or parameters instead of citing one production's records, and keeps its unit tests with it. Each production still answers for its own use: its entity or scene cites its own settings or brief facts and passes them in.

A single production has no workspace packages and keeps its modules in `src`.

## Execution and runtime setup

Read the actual source entry, runtime configuration and installed APIs before adopting a host or integration, and record the choice and its authority in [project context](../production/project-context.md); [assembly](../production/assembly.md) verifies export on the assembled film.
