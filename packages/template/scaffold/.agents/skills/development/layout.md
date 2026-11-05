# Source layout and runtime setup

Use this resource when placing source code or tests, or adopting a host or integration.

## Source

Each source folder follows the path of the document it realizes, so the code and the document it cites pair by path. Every exported declaration answers the shared [development contracts](../contracts/development/SKILL.md); a folder that realizes a document also answers its own contract.

| Location, when used | Owns | Realizes and cites |
| --- | --- | --- |
| `src/assets/<domain>/<subject>/` | Representations, rigs and reusable authored controls for one subject | The settings record `docs/body/settings/<domain>/<subject>.md`, under the [asset contract](../contracts/development/assets.md) |
| `src/motion/<family>/` | Reusable motion modules for one movement family | The performance study `docs/research/<study>.md`, under the [motion contract](../contracts/development/motion.md) |
| `src/shots/<film>/<scene>/` | One screenplay unit's choreography as data, realized by calling asset, motion, camera and sound modules | The screenplay H2 it executes, under the [shots contract](../contracts/development/shots.md) |
| `src/shots/shared/<scene>/` | A shot several films reuse, such as an opening title | The screenplay H2 that first decides it |
| `src/films/<film>.ts`, registered in `src/films/index.ts` | One delivered video: its shots in order, transitions, sound placement and delivery profile, as data | The screenplay file `<film>` names, under the [films contract](../contracts/development/films.md) |
| `src/integrations/`, when needed | Provider or local-tool integration code | The generation requests in `docs/prompts/` |
| `src/*.ts` | The Viewer entry, which mounts the film its `film` parameter selects, and the film types and selector | Nothing |
| `test/features/<same path>/` | Unit tests of the source folder at the same path | Nothing |
| `public/` | Small fixed browser inputs; audio and video belong in [media](../production/media.md) | Nothing |
| Runtime `README.md` and `.env.example` | Nonsecret setup, commands, environment-variable names, and example configuration | Nothing |
| Ignored local `.env` | Actual secret values required by adopted integrations | Nothing |

`<film>` is the screenplay file's name, such as `kickboxing` or `001-episode`, and the same name reaches `media/automovie/<film>/`, so a scene, its shot, its film and its video pair by path. The entry, films and shots only compose: evaluation, playback, seeking and export belong to the installed packages, and every visible behavior, camera moves and contact consequences included, belongs to a module. A behavior several productions can use belongs in an installed package such as `@automovie/engine` or `@automovie/human` and is imported; a value only one scene uses stays in that scene's data. A small program can combine source roles; split them where independent changes or reuse justify it, keeping each shared value with one owner. Implementation may use as many or as few shots as the scenes need; preserve the relationship to the actual screenplay units and delivered edit.

## Execution and runtime setup

[Production](../production/SKILL.md) routes the commissioned work to its specialists. Read the actual source entry, runtime configuration and installed APIs before adopting a host or integration; available files alone do not prove working playback or export. [Finishing](../production/finishing.md) verifies that path and the assembled artifact. Select an external generation service only for a commissioned generation workflow.

[Project context](../production/profile.md) owns operating choices and authority. README and `.env.example` document the actual commands and nonsecret configuration; ignored `.env` holds credentials. Installed APIs own callable behavior.
