# Malfoy shorts

One production delivers four original English Harry Potter fan shorts about Carina Malfoy and Harry Potter, fifteen-year-old Hogwarts schoolmates. Each short is one screenplay file and one film; all four share one cast, one world, one set of props and one motion library.

## Commission {#commission}

The user commissioned the four Malfoy shorts that earlier lived as separate productions under `movies/shorts/` (`look-at-me-duel`, `paper-crane-invitation`, `snitch-before-you`, `three-oclock`, with `shared-characters`) to be merged into this single production on the current scaffold. Their settings and screenplays are references only: every settings record and screenplay here is written anew under the current story skills, because the scaffold and its skills changed substantially. Their source code is likewise reference only.

The modular standard is the `movies/shorts/kickboxing` production: every character, set, prop, camera, law and motion is a module with its own tests, and a film only orders scenes that chain those modules' capabilities, so the film carries nothing but the screenplay's business logic.

## Films {#films}

| Film (`?film=`) | Screenplay | Story |
| --- | --- | --- |
| `look-at-me-duel` | `docs/body/screenplay/look-at-me-duel.md` | A private practice duel in which a repeated wrist grip becomes a rescue |
| `paper-crane-invitation` | `docs/body/screenplay/paper-crane-invitation.md` | Carina tries to take back a paper-crane tea invitation from Harry, and the tug becomes an invitation to share a bench |
| `snitch-before-you` | `docs/body/screenplay/snitch-before-you.md` | In a fourteen-rider practice match Carina gives up an almost certain Snitch catch to save Harry, ending in tandem flight |
| `three-oclock` | `docs/body/screenplay/three-oclock.md` | Carina tries to invite Harry out: a repeated walk, a note offered and withdrawn, two people bending at once |

## Scope and form {#scope}

- Route: short with settings, settings → final screenplay for each film, with no treatments or scripts.
- Output per film: a complete deterministic whole motion-video hint, programmed staging, motion and camera for every scene, assembled as one 60-second film. Vertical 9:16, 720 × 1280, 24 fps. Direct 3D render through the Viewer is the delivered picture; no diffusion generation, upload or paid call is commissioned.
- Representation: people are production block mannequins on the Human bone names, fitted by the production's own two-bone limb law, and sets and props are coarse code-authored geometry. Human polygon figures were the first choice, but on the current tree Human calibration fails in its head law for every person tried, including the playground's reference person, after 44–65 s per attempt; the mannequin keeps the same chain API, so the Human path can return once Human calibrates again. Carina wears a Slytherin uniform and Harry a Gryffindor uniform, readable as collar, house-striped tie, charcoal knit, open black robe, school bottoms and black shoes, with hands, knees and feet left legible.
- Sound: the films are silent motion hints; no speech or music is adopted. Dialogue lives in the screenplays.- All production text, titles and source are English.

## Ownership {#ownership}

One settings and motion owner writes `docs/body/settings`, `docs/research`, and the shared library under `src/entities`, `src/laws`, `src/interactions` and `src/consequences` with their tests. Each film has its own owner for its screenplay, `src/composition/scenes/<film>/` and `src/composition/films/<film>.ts`; a film owner asks the settings and motion owner for a missing capability and uses it through its API rather than growing it inside a scene. The coordinator owns `src/*.ts`, `src/executable`, package changes and integration.

## Inspection {#inspection}

`npm run capture` draws film frames directly in Node, with no Viewer server or browser, and is the routine visual check: by default a 10-second window at 5 frames per second (raise `--rate` to at most 10 where motion needs it), with 20-cell sheets; `--module test/rehearsals/<discipline>/<motion>.ts` captures a motion rehearsal the same way. `npm run lint -- --watch` keeps one shared type-check running; every agent reads its log at `.cache/watch/ttsc.log` instead of starting another compile. Browser playback and MP4 export through `npm run dev` and `npm run render` remain the delivery path.

No commit, push or pull request is part of this commission until the user asks.
