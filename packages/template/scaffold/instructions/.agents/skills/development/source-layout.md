# Source layout

Where source, tests and runtime setup belong, and where a new subject, practice, scene, host or integration goes.

## Source

One folder owns each responsibility, and the folders follow the chain from settings or brief through the screenplay to the delivered film, so a module and the document it realizes pair by path. Each source folder answers the shared [development contracts](../contracts/development/SKILL.md) and its own.

| Location | Owns |
| --- | --- |
| `src/entities/<kind>/<subject>/` | One subject |
| `src/composition/scenes/<film>/<scene>/` | One screenplay scene file's composition |
| `src/composition/scenes/catalog/<module>/` | One module's catalog case |
| `src/composition/films/<film>.ts` | One delivered video |
| `src/composition/films/catalog.ts` | The review catalog, never delivered |
| `src/laws/<discipline>/` | Registered rows and laws, when a film needs one |
| `src/interactions/<discipline>/` | A relation several scenes share, when a film has one |
| `src/consequences/` | Commissioned effects and sound cues |
| `src/*.ts` | The page entries, the subjects module and the film selector |
| `src/executable/` | The Node commands the README documents |
| `src/integrations/<provider>/` | Code for an adopted provider or local tool |
| `test/features/<source path>/` | Unit tests of the source at the same path |
| `public/` | Small fixed browser inputs |

Entities, scenes and films are every film's base. The laws, interactions and consequences folders wait for the needs described below, and no empty folder is created to fill the layout.

### Entities

`<kind>` is one of `cast`, `crowds`, `props`, `sets`, `cameras` and `lights`. A subject's folder holds its public entry class `<Subject>.ts` and the fragments it composes, such as a person's prepared body or an object's affordances.

An entity realizes its settings or brief record's facts and the research its measurements follow, under the [entities contract](../contracts/development/entities.md).

### Scenes and films

A scene composition realizes its screenplay scene file, with that file's sections and beats. A film orders its scenes and holds the transitions, titles and subtitles, grade, [delivery profile](../production/project-context.md) and control channels of one delivered video. Both answer the [composition contract](../contracts/development/composition.md), which also sets how a catalog case names what it exhibits.

A catalog case composition takes its case parameters, such as an action with its target, partner response and outcome, or an entity state. The catalog film gives each case its interval.

Every film is registered in `src/composition/films/index.ts`.

`<film>` is the screenplay film folder's path under `docs/body/screenplay/` with `/` replaced by `--`, such as `duet` or `001-part--001-episode`. `<scene>` is a scene file's name without `.md`, such as `010-ring`, so two scenes at the same place keep separate folders.

The same film name reaches `media/automovie/<film>/`, so screenplay, scene, film and video pair by path and two parts' episodes cannot collide. Rendered frames, videos and control channels go to [media records](../production/media-records.md), never into `src`.

### Laws, interactions and consequences

These three folders answer the [behaviors contract](../contracts/development/behaviors.md), and a film adds one only for the need below.

`src/laws/<discipline>/` holds a row or law registered with the motion vocabulary, the law of a body no installed package moves, and a rule or table the practice adds, such as which actions it allows. Each follows the adopted rules and any `docs/research/<discipline>/` study it required.

`src/interactions/<discipline>/` holds a relation between entities by role that several scenes reuse: who joins whom in a mutual action, what synchronizes on what, and how cameras and lights follow the action. A catalog case counts as a scene here, so an exchange the catalog accepts and a film scene then composes lives in this folder. A relation one scene uses stays in that scene.

`src/consequences/effects/` and `src/consequences/sound/` hold what the performed outcomes leave when the commission asks for it, such as scuffs and dust, or the effect cues of a preview or soundtrack.

### Host, commands and integrations

The page entries in `src/*.ts` are the inspector's and the draw page's, and the film interfaces sit beside them. `src/executable/` also holds the tooling its commands run. Node-only tooling the installed command-line tool does not run, such as the physics and recovery commands, is not published, so the production owns the scaffold-supplied copy there and keeps it in step with the scaffold.

`src/integrations/<provider>/` realizes the generation requests in `docs/prompts/` for a provider the production adopts, such as a video-generation service.

The runtime `README.md` and `.env.example` hold nonsecret setup, commands, environment-variable names and example configuration, and the ignored local `.env` the secret values. Audio and video never go in `public/`; they belong in [media records](../production/media-records.md).

### Records to code

Each settings or brief domain maps onto code:

| Domain | Becomes |
| --- | --- |
| Cast, crowds, props and sets | Entities of the same kind |
| Cinematography | Camera and light entities, and the film's look |
| World rules | Outcomes the screenplay decides under them |
| Sound palettes | Each shot's sound description |
| Weather and atmosphere | A set's state by story day |

The sound description goes in the video-diffusion prompt under [audio](../audio/SKILL.md), and ambience also reads the set's state.

A generated film carries its look in the video prompts' shared description, a direct 3D film in the materials of the entities' detail options and the film's grade.

## How the parts work together

An entity is constructed from its settings or brief facts and composes small fragments. Its methods are capabilities: each says what the subject does and to whom, never a pose, a coordinate or a time.

A person's capability returns the installed motion vocabulary's own composition of the action, built from the cast member's prepared body, the proficiency the cast record gives and the targets the scene passes. The entity adds no motion of its own.

A scene joins capabilities through the operators of the installed motion vocabulary and engine, and states each outcome the screenplay decided. The vocabulary aligns the participants and times their contacts, so a scene writes no alignment, timing rule or outcome rule.

The whole composition resolves once per film into a frozen schedule, and every film second is a pure function of that schedule. Each film has one seed from which every seeded stream derives, the motion vocabulary's included, so reseeding a film reseeds every performer together. A film that continues another starts from that film's final state snapshots.

A film only composes, as the [composition only](../contracts/development/composition.md#composition-only) item requires. The catalog and the screenplay films call the same capabilities with the same kind of parameters, so a case accepted in the catalog plays the same way in the film.

The object shell over a functional core is the production's own style; installed packages keep theirs.

## Dependencies and files

Imports point down the chain: host and commands to films, films to scenes, scenes to consequences, interactions and entities, and each of those to laws and installed packages. Tests may import any source folder. An import against that direction, or into a folder outside the source table, is a layout defect.

A subject never imports another subject and a scene never imports another scene: an interaction relates subjects by role, and a film orders scenes. Lint stays generic and rejects `Math.random` everywhere.

What serves every production belongs to the installed packages, never to a production folder.

Each file exports one declaration named as the file and stays under 500 lines; split a larger one into fragments.

Work starts at the document it realizes: a new subject from its settings or brief record, then its entity folder and tests, and a new scene from its screenplay scene file, then its composition folder and its place in the film.

A new action starts from the installed motion vocabulary. It starts from its research and a registered row or law only when motion's vocabulary extension finds the vocabulary lacks it.

## Modules

### One module

Each subject or action has one definition. Another version of it, such as a taller fighter or a tired walk, is the same module with other parameters or another seed, so a repair reaches every version together. When a version needs something the module cannot express, give the module that parameter.

### Shared modules

A module a second production of the workspace needs moves to a workspace package under `packages/<name>` and is imported by both, because a copied entity or law is a copied variant at workspace scale. A single production has no workspace packages and keeps its modules in `src`.

The shared module takes what differed between the productions as constructor input or parameters instead of citing one production's records, and keeps its unit tests with it. Each production's entity or scene still cites its own settings or brief facts and passes them in.

## Execution and runtime setup

Read the source entry, runtime configuration and installed APIs before adopting a host or integration, and record the choice and its authority in [project context](../production/project-context.md); [assembly](../production/assembly.md) verifies export on the assembled film.
