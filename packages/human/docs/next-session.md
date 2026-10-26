# Human campaign continuation

Continue [#2925](https://github.com/samchon/automovie/issues/2925) through the redesign [#2993](https://github.com/samchon/automovie/issues/2993) by the Human skill's [work order](../../../.agents/skills/human/SKILL.md#work-order). [survey.md](survey.md) holds its survey and the open defects with their causes, and [redesign-plan.md](redesign-plan.md) its plan; [reproduction-status.md](reproduction-status.md) records the current generator's path and the last campaign's measurements. Hair stays textured cards.

## Read and act

Read `AGENTS.md`, the Human, 3D Modeling, Development, Contracts and Review skills, and Human's references, reverse-analysis, anatomy, construction, verification and screenshot guides. Work alone unless the user delegates. Keep `IAutoMovieHumanParameters`, `AutoMovieHuman.generate(params)` and `IAutoMovieHumanGenerated` compatible; typed examples under `packages/playground/src/human-parameters/` own the inputs.

## Shape law

Change a person's shape through `AutoMovieHumanBodyLaw`, never through person-indexed tables or alias branches. After any change to the specimen calibration or a head fitter, regenerate the basis and the specimen inputs with `test/src/executable/reference-experiments/human-calibration/fitBodyMorph.ts` (see that directory's README), because the basis is sampled on the calibrated surface. A further basis direction needs more specimens than the three that identify the masculine-feminine one.

## Tracing a line

Measure where a line comes from before naming its cause: several lines that looked like curvature jumps were the mesh's triangles joining same-phase points that slide several millimetres between close layers, and the section-union surface itself was smooth (intersect the sections with a fixed plane across the ring every 0.1 mm of station and read the profile).

## Running TypeScript here

`ttsx` re-emits the whole Human graph on every run (about 15 minutes on this shared machine) and aborts when a source changes meanwhile. Run scratch TypeScript from the ignored `.shots/` tree with `node --experimental-transform-types --import <hook>`, where the hook registers a resolver that retries relative specifiers with `.ts`; a full generation then takes about 20 s. Never point `ttsc --emit` at a configuration that reaches `packages/*/src`: it writes JavaScript beside the sources, which Vite then serves instead of the TypeScript.

## Inspection

Reuse the single server at `http://127.0.0.1:5173`; Human is `/human.html?alias=<alias>`. Every edit under `packages/human/src` reloads the worker page, so make edits between capture batches, not during them. Frames take one to two minutes each on this machine. The [inspection round](../../../.agents/skills/human/verification.md#inspection-round) and the [audits](../../../.agents/skills/human/verification.md#audit-and-user-reports) name the views; the curvature combs of the curve diagrams exposed the crotch ringing.

## Deferred scope

Pose and skin rigging stay in [#2947](https://github.com/samchon/automovie/issues/2947); mouth interior, tongue and visemes in [#2971](https://github.com/samchon/automovie/issues/2971). Human and Human-viewer tests must not be written, restored or run. The MetaHuman comparison is complete.
