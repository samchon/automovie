# Human session brief

Work on `packages/human` in `D:\github\samchon\AutoMovie`, branch `feat/human-test-foundation` (draft pull request #3043). Report to the owner in Korean, with every technical term explained in plain words.

## Goal

Every person comes from one universal construction, as the `human` skill defines it; f1, f2, m1 and m2 are observations for its rules.

Repair F1 first and check F2, M1 and M2 by machine only, writing every law as a function of the person's inputs. F1 is finished when its whole neutral figure, every close-up and every curve view show no plate, lump, kink, groove, step, fin, crest, gap or crossing, every part is present and in proportion, and its diagnostics list is empty. Hair and underwear wait until the body is finished.

Decide by yourself and follow every owner's order exactly as given.

## Rule

Find every phenomenon and every cause, hidden ones included, before changing anything; fix them all in one batch; give each fixed defect a test that fails if it returns. Every fix and test is universal, orthodox, rational and scientific; never a patch at the symptom, a special case or a hard-coded value or expectation.

## Read First

- `AGENTS.md` and the skills `human` (every file), `3d-modeling`, `development`, `contracts`, `documentation` and `pull-request`.
- `packages/human/debug/README.md`, `packages/human/docs/techniques/` (first `construction-levels.md` and `seam-registry.md`), `packages/human/docs/testing/consistency.md`.
- `packages/human/docs/work/modeler-log.md` and `parameter-anatomy-survey.md`.

## Order

1. Clear the structural debt in `packages/human/src` and `test/src` until a complete survey finds none: a file that only forwards to another function or holds one constant joins its owner's table; one person's data leaves the library for `packages/human/debug/people/`, and every missing input comes from `AutoMovieHumanBodyAnatomy.resolve`; no test cache outlives its test; one person's generation returns to about 85 s. Open now: `AutoMovieHumanLegBones.KNEE_AHEAD` and the finger shares taken from f1, the trunk, leg and neck priors still regressing on the old shape sliders, and the final survey.
2. Wire the anatomy fields no piece reads yet (`parameter-anatomy-survey.md`, State at hand-off), and run the Human tests.
3. Work the `human` skill's cycle on F1 until it is finished, running the tests of every touched region after each batch.
4. Widen to F2, M1 and M2, then to every supported person.

## Every 15 Minutes

From step 3 on, schedule with `CronCreate` at minutes 7, 22, 37 and 52:

1. Check every file changed since the last round against the skills' rules and fix every violation.
2. Send the owner twelve images at once with `SendUserFile`: F1, F2, M1 and M2, each front, left and back, the whole neutral figure from soles to hair tips with at least 5 percent margin, from one source, every PNG opened first. A person that fails to generate keeps its slots with a one-line cause, and its repair comes first.
3. Report in three to six lines.

## Boundaries

- Logic, scripts and probes live in tracked files; the ignored paths hold images and data only.
- Run TypeScript with `ttsx` only, and run nothing while the compile is red.
- Commit by topic every hour and push.

Time matters: F1 by 06:00, F2, M1 and M2 by 07:30, final commit and report by 08:30.

## Starting State

| Region | Open on F1 |
| --- | --- |
| Head and neck | neck a 21 mm band under the head's seat (`modeler-log.md` C1-1, C1-4), jaw side bulge and front groove, collar step, forehead and temple grooves, eyelid step, chin step, ear root seam |
| Trunk, shoulder, arm | plate over each shoulder (C1-1), flat chest (C1-3), fin at the arm root (C1-6), lower belly that ignores body fat |
| Buttock and groin | cone behind each buttock with a folded band under it (C1-2), ring at the top of each thigh (C1-7) |
| Hand and foot | fold at the index and middle finger-root webs, thenar bump and thumb branch, lateral foot border bend |
| Leg and rig | curvature bands at the knee, neutral arm gap, armpit band stretch, calf belly, knee contour |
| Red F1 tests | `dent_forehead`, `dent_hip`, `dent_shank`, `dent_temple`, `fold_lean`, `rib_neck_front`, `step_groin`, `step_neck_base`, `step_shoulder`, `lump_buttock`, `plate_shoulder`, `rib_heel` |
