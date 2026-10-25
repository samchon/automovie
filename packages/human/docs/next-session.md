# Human campaign continuation

Continue [#2925](https://github.com/samchon/automovie/issues/2925) from the merged result of [#2976](https://github.com/samchon/automovie/pull/2976). Read [reproduction-status.md](reproduction-status.md) first for the generation path, this round's measurements and the open defects. The user asked for an adequate, presentable result rather than exhaustive precision; hair stays textured cards.

## Read and act

Read `AGENTS.md`, the Human, 3D Modeling, Development, Contracts and Review skills, and Human's references, reverse-analysis, anatomy, construction, verification and screenshot guides. Work alone unless the user delegates. Keep `IAutoMovieHumanParameters`, `AutoMovieHuman.generate(params)` and `IAutoMovieHumanGenerated` compatible; typed examples under `packages/playground/src/human-parameters/` own the inputs.

## Shape law

Change a person's shape through `AutoMovieHumanBodyLaw`, never through person-indexed tables or alias branches. After any change to the specimen calibration, regenerate the basis and the specimen inputs with `test/src/executable/reference-experiments/human-calibration/fitBodyMorph.ts` (see that directory's README), because the basis is sampled on the calibrated surface. A further basis direction needs more specimens than the three that identify the masculine-feminine one.

## Remaining work

Fix the defects listed in the status file by cause, f1 first, then recheck f2, m1 and m2 under the same views, since every common rule reaches all four. The largest visible ones are the eye-height groove at the 1595.5 mm ring, the mouth-corner notches, the line under the nostrils and the hair fringe; the status file gives the traced cause of each, all in the head calibration's section fits. After a head fitter change, regenerate the shape basis.

## Running TypeScript here

`ttsx` re-emits the whole Human graph on every run (about 15 minutes on this shared machine) and aborts when a source changes meanwhile. Run scratch TypeScript from the ignored `.shots/` tree with `node --experimental-transform-types --import <hook>`, where the hook registers a resolver that retries relative specifiers with `.ts`; a full generation then takes about 20 s. Never point `ttsc --emit` at a configuration that reaches `packages/*/src`: it writes JavaScript beside the sources, which Vite then serves instead of the TypeScript.

## Inspection

Reuse the single server at `http://127.0.0.1:5173`; Human is `/human.html?alias=<alias>`. Every edit under `packages/human/src` reloads the worker page, so make edits between capture batches, not during them. Frames take one to two minutes each on this machine. Use the viewer's surface, overlay and construction passes, `garment=0`, `hair=0`, `material=clay`, raking light, free cameras and the curve diagrams, whose curvature combs exposed the crotch ringing. While modeling, capture and open f1's underwear-off front, side, top and back and the construction front, side and back every 15 minutes, keeping UTC, SHA and source linkage.

## Deferred scope

Pose and skin rigging stay in [#2947](https://github.com/samchon/automovie/issues/2947); mouth interior, tongue and visemes in [#2971](https://github.com/samchon/automovie/issues/2971). Human and Human-viewer tests must not be written, restored or run. The MetaHuman comparison is complete.
