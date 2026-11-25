# Source layout

## Source

Pair each source module with the document it realizes by path. Apply the shared and folder-specific [development contracts](../contracts/development/SKILL.md).

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
| `src/*.ts` | The page entries, `subjects.ts` listing what capture draws, and the film selector |
| `src/executable/` | The Node commands the README documents |
| `src/integrations/<provider>/` | Code for an adopted provider or local tool |
| `test/features/<source path>/` | Unit tests of the source at the same path |
| `public/` | Small fixed browser inputs |

Entities, scenes and films are every film's base. The laws, interactions and consequences folders wait for the needs described below, and no empty folder is created to fill the layout.

### Entities

`<kind>` is `cast`, `crowds`, `props`, `sets`, `cameras` or `lights`. Keep the public `<Subject>.ts` class and its fragments in the subject's folder.

An entity realizes its settings or brief record's facts and the research its measurements follow, under the [entities contract](../contracts/development/entities.md).

### Scenes and films

A scene realizes its screenplay file, sections and beats. A film owns scene order, transitions, titles and subtitles. A direct 3D film also owns its camera response, grade included, its sound list and its loudness record. A film's delivered render implements the [delivery profile](../production/project-context.md#the-delivery-profile), and a [channel render](../video/requests.md#inputs) departs from it. Apply the [composition contract](../contracts/development/composition.md) to the screenplay's scenes, the [films contract](../contracts/development/films.md) to its films, and the [catalog contract](../contracts/development/catalog.md) to the catalog.

A catalog case takes the parameters of the behavior or entity state it exhibits. The catalog film gives the case its interval.

Every film is registered in `src/composition/films/index.ts`.

Derive `<film>` from its path under `docs/body/screenplay/` by replacing `/` with `--`. Derive `<scene>` from its file name without `.md`.

Use the same film name in `media/automovie/<film>/`. Keep render output and channels under [media records](../production/media-records.md).

### Laws, interactions and consequences

These three folders answer the [behaviors contract](../contracts/development/behaviors.md), and a film adds one only for the need below.

`src/laws/<discipline>/` holds registered rows and laws, unsupported bodies' laws and practice rules or tables. Follow adopted rules and relevant `docs/research/<discipline>/` studies.

`src/interactions/<discipline>/` holds relations shared by scenes, including catalog cases. Keep relations used by one scene in that scene.

Keep commissioned outcome effects in `src/consequences/effects/` and outcome sound cues in `src/consequences/sound/`.

### Host, commands and integrations

Keep inspector and draw entries with film interfaces in `src/*.ts`. Keep command tooling in `src/executable/`. The production owns and maintains its scaffold copies of unpublished Node tooling.

`src/integrations/<provider>/` realizes the generation requests in `docs/prompts/` for a provider the production adopts, such as a video-generation service. No film or scene calls it, because generation stays outside deterministic playback.

Keep public setup and sample environment variables in the runtime `README.md` and `.env.example`. Keep secrets in ignored `.env` and audio and video under [media records](../production/media-records.md).

### Records to code

Each settings or brief domain maps onto code:

| Domain | Becomes |
| --- | --- |
| Cast, crowds, props and sets | Entities of the same kind |
| Cinematography | Camera and light entities, and the film's look |
| World rules | Outcomes the screenplay decides under them |
| Sound palettes | Each shot's sound description |
| Weather and atmosphere | A set's state by story day |

For a generated film, carry the sound description into [video requests](../audio/generated-sound.md). For a commissioned separate soundtrack, follow the [soundtrack route](../audio/soundtrack.md). Derive ambience from the set's state where sound is in scope.

A generated film carries its look in the video prompts' shared description, a direct 3D film in the materials of the entities' detail options and the film's grade.

## Dependencies and files

Imports go from hosts and commands to films, scenes, then consequences, interactions and entities, then laws and installed packages. Tests may import any source folder. Follow the source table.

A subject never imports another subject and a scene never imports another scene: an interaction relates subjects by role, and a film orders scenes. Lint stays generic and rejects `Math.random` everywhere.

What serves every production belongs to the installed packages, never to a production folder.

Each source file exports one declaration named as the file. Split a file by responsibility when it holds separable parts, not by line count.

Work starts at the document it realizes: a new subject from its settings or brief record, then its entity folder and tests, and a new scene from its screenplay scene file and its [beat elements](../motion/staging.md#reading-the-scene), then its composition folder and its place in the film.

Compose the actions of a [studied performance](../story/planning/research.md#what-needs-a-study) with installed motion modules. [Extend the vocabulary](../motion/laws/SKILL.md) when those modules cannot realize the action.

## Execution and runtime setup

Read the source entry, runtime configuration and installed APIs before adopting a host or integration, and record the choice and its authority in [project context](../production/project-context.md); [assembly](../production/assembly.md) verifies export on the assembled film.
