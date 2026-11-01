---
name: human
description: Replaces the fitted Human calibration tables with one reusable construction from anatomical centres, frames and dimensions, proven by whole vertical slices, a CPU score and the viewer. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Generate every supported person from parameters by one reusable construction. The fitted tables are gone, so a change never brings one back. Find the major anatomical centres, draw lofting curves from them and construct each following layer up to the next centre by any anatomically and scientifically sound equation, recurrence or recursion. [Generalization](../../../packages/human/docs/generalization.md) holds the measurements, a candidate construction and the findings to reuse; it is a starting point, and a better construction replaces it. [Campaign #3013](https://github.com/samchon/automovie/issues/3013) owns the tasks and how agents divide them. An explicit stop overrides every instruction here.

## Done When

- Every public parameter changes the figure through that construction.
- f1, f2, m1 and m2 come from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain.

## Order

1. Build the [score](verification.md#score) before changing geometry, and pass the [unit tests](verification.md#unit-tests) before rendering. A render costs about a gigabyte of memory and often returns nothing, so an agent without a cheap numeric check spends its time on transport instead of shape.
2. Measure the data and choose the construction yourself. The choice of equations, representations and tools is yours.
3. Change one part at a time and leave the whole figure working: emit `IAutoMovieHumanLoftChain` under the same chain names, so `AutoMovieHumanBodySurface`, `AutoMovieHumanEventJoin`, skin, appearance and construction keep working unchanged.
4. Inspect the change in the viewer and record what it taught in Generalization. A green curve test is not a pass: the viewer showed a step, a shelf and stripes on figures the rules passed. Give each defect it finds a rule, and prove the rule fails on the defect.

Plan only as far as the next change. When a change disproves a construction, stop, record why and choose another instead of patching it.

Build both sides through one canonical construction and a declared reflection, including boundary maps, derivatives and orientation. A candidate that stores a person's rows and deforms them is not a construction. Change the section representation only when a part shows the existing one cannot carry the law: each new representation spreads into joins, caps, normals and sampling.

## Boundaries

- Reduce independent numbers, never curves. Keep generated curve and section density at or above the current figure; the construction evaluates as many curves as the surface needs. Sparse keys and fixed low control counts lost anatomy each time they were tried.
- Keep a small shape prior when the anatomy needs it: named constants in normalized part coordinates, shared by every person. A table per person, per row or per side is not allowed, and moving or compressing a table is not replacing it.
- Treat every difference from a reference or from master as evidence, never as a target. A large held-out error can reject a law; correcting a coefficient to shrink it is overfitting. Smoother and better curves than master are welcome.
- Make skin smooth through its generating mathematics, with no smoothing pass, clamp, threshold or exclusion after construction.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, joined to its neighbours by a rule in [Surface composition](../../../packages/human/docs/techniques/surface-composition.md). Reuse the existing skin-joining extension, keep common mathematics in one shared module, and give each shared boundary one owner that its neighbour copies.
- Keep full skin, the normal generation path, rigs, export and other consumers working at every commit. Replacing them with empty or unavailable output is a regression.
- Leave genitals and nipples out of the modelled skin.
- Use meshes and saved Recovery/Hermite curves as observations for rules, judge appearance against the original [photographs](screenshot.md#references), and never treat a ruled reverse-render artifact as an anatomical target. Recovery's ruled striping and cracks are accepted reference error that will not be fixed, so allow for them and construct better skin on your own instead of following them.
- Claim no common law or prediction for other people from f1 reproduction alone.
- Check Human logic and mathematics only through unit tests, written when needed and run alone by `pnpm test --include <name>`, with no one-off numeric scripts beside them. A Human test [audits everything before it fails](verification.md#unit-tests), so one run gives the whole worklist. Hardcode no test to specific coordinates or output snapshots apart from the curve audit's coarse slice bound. Write no test for the viewer. The score is a local executable, not a test.
- Acquire further references without asking, by the [reference-experiments README](../../../test/src/executable/reference-experiments/README.md). Generalization says which references help.
- Call the references f1, f2, m1 and m2, or the reference source. The user does not want the generator behind them named in any file, issue, commit or pull request.
- Run no `git clean -x` or `git stash --all` here, and compare a branch's added paths with the disk before switching to it. `test/.shots`, `test/src/executable` and `.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning.
- Tell the user only what you checked.
