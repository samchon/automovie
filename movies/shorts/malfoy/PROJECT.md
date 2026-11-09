# Project

## Overview

Four original English Harry Potter fan shorts about Carina Malfoy and Harry Potter, fifteen-year-old Hogwarts schoolmates. Each film is a sixty-second vertical piece built around one physical exchange between the two, in which a touch, a reach or a grip turns a small private moment into a closer one. The films share one cast, one world, one set of props and one motion library; each starts from the same baseline and nothing one film changes carries into another. The creative requirements live in [docs/instructions](docs/instructions/), the world and its people in [settings](docs/body/settings/), and the studies they draw on in [research](docs/research/index.md).

| Film (`?film=`) | Premise |
| --- | --- |
| `look-at-me-duel` | A private practice duel in which a repeated wrist grip becomes a rescue |
| `paper-crane-invitation` | Carina tries to take back a paper-crane tea invitation from Harry, and the tug becomes an invitation to share a bench |
| `snitch-before-you` | In a fourteen-rider practice match Carina gives up an almost certain Snitch catch to save Harry, ending in tandem flight |
| `three-oclock` | Carina tries to invite Harry out: a repeated walk, a note offered and withdrawn, two people bending at once |

## Commissioned scope

- **Output per film:** one complete deterministic whole motion-video hint, 60 seconds, vertical 9:16 at 720 × 1280, 24 fps, with programmed staging, motion and camera for every scene. The direct 3D render through the Viewer (`npm run render -- --film <name>`) is the delivered picture.
- **Writing route:** short with settings (`short-with-settings`): settings, then one final screenplay per film at `docs/body/screenplay/<film>.md`; no treatments, scripts or outlines.
- **Excluded:** video generation, image generation, uploads and every paid call; voice, sound effects, music and lip sync (the hints are silent, and dialogue lives only in the screenplays); uniforms, hair and faces on the figures.
- **Done when:** each film's screenplay passes its construction and expression passes with independent review, every film is composed from accepted catalog cases, and each rendered film passes [delivery review](.agents/skills/review/delivery.md).

## Adopted approach

- **Figures:** the installed `@automovie/human` figures as bare bodies carrying pose and motion only; diffusion later takes appearance from reference images, so the settings record appearance for that later stage without modelling it.
- **Sets and props:** coarse code-authored geometry that stays identifiable at the delivered raster.
- **Motion:** every interaction is authored as effectors brought to targets — hands to a wrist, a note, a crane or a broom handle; feet to the floor, a step or a footrest; the seat to a bench or a broom; a catching hand to the Snitch — with the rest of the body solved from those contacts, as the user instructed ([motion instruction](docs/instructions/motion.md)) and the [effector-targeting study](docs/research/motion/effector-targeting.md) sets out. Joint values are hand-set only where no contact defines them.
- **Physical mode:** kinematic hints by default; a scene states any simulated or exaggerated body in its composition.
- **Canon:** Harry Potter canon used (houses, Quidditch, wands, Hogwarts) is an adopted choice, not a checked claim; no published Carina Malfoy story is adapted. The delegated canon choices are recorded in [direction](docs/instructions/direction.md).

## Tools and operating constraints

- Production directory `movies/shorts/malfoy` of the AutoMovie workspace, a pnpm workspace member: use `pnpm run <script>` for every script; installs happen only at the workspace root.
- Language: all production text, titles and source are English.
- Stills for review come from `pnpm run capture`; the delivered video from `pnpm run render` against the running Viewer.

## Authority and open choices

- **Fixed by the user:** the four premises and film names, the shared world with no carry-over, duration, raster and frame rate, bare-body representation, silence, English, the canon boundary and the effector-to-target motion method.
- **Decided within delegation:** the canon placement of Carina, the period of the school year, the tone and the baseline relationship ([direction](docs/instructions/direction.md)); the settings' invented facts are marked as such where they are recorded.
- **Open:** each film's events, dialogue and camera, which belong to its screenplay.
