---
name: human
description: Replaces the fitted Human calibration tables with one reusable construction from anatomical centres, frames and dimensions, proven by whole vertical slices, a CPU score and the viewer. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Generate every supported person from parameters by one reusable construction instead of the tables in `packages/human/src/generation/calibration/`. Find the major anatomical centres, draw lofting curves from them and construct each following layer up to the next centre by any anatomically and scientifically sound equation, recurrence or recursion. [Generalization](../../../packages/human/docs/generalization.md) holds the measurements, a candidate construction and the findings to reuse; it is a starting point, and a better construction replaces it. [Campaign #3013](https://github.com/samchon/automovie/issues/3013) owns the tasks and how agents divide them. An explicit stop overrides every instruction here.

## Done When

- The fitted section tables and the row repairs that exist only because of them are deleted, and ordinary generation runs without them.
- Every public parameter changes the figure through that construction, including the inputs nothing reads today.
- f1, f2, m1 and m2 come from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain.

## Order

1. Build the [score](verification.md#score) before changing geometry. A render costs about a gigabyte of memory and often returns nothing, so an agent without a cheap numeric check spends its time on transport instead of shape.
2. Measure the data and choose the construction yourself. Scratch analysis of the tables and meshes is allowed and expected; the choice of equations, representations and tools is yours.
3. Finish one [vertical slice](#vertical-slices), the leg by default because it is a plain tube with few modes and the smallest difference between people.
4. Inspect the slice, record what it taught in Generalization, and widen to the next part. The default order is foot, arm, trunk, hand, head; change it when a measurement gives a reason. The head holds 56 percent of the table numbers and the hardest features, so it comes last even though it pays the most.
5. Replace the Morph basis and the measurement Warp with the construction's own response, then connect the unread inputs.

Plan only as far as the next slice. An attempt that planned every part in advance wrote 500 KB of plan before any module reached ordinary generation, and the first slice would have changed that plan anyway. When a slice disproves the construction, stop, record why and choose another instead of patching it.

## Vertical Slices

A slice replaces one chain family in ordinary generation and leaves the whole figure working. Deliver the whole campaign in one pull request with one commit per slice, because the user wants it landed at once and a partial landing would leave two authorities in the generator.

- Emit the existing `IAutoMovieHumanLoftChain` at runtime under the same chain names, so `AutoMovieHumanBodySurface`, `AutoMovieHumanEventJoin`, skin, appearance and construction keep working unchanged.
- Keep the layer count of a chain until its Morph rows are replaced, because `AutoMovieHumanBodyLaw.displace` throws when a chain's layer count differs from its basis.
- Delete the replaced rows in the same change. A slice that adds more source bytes than it deletes is not finished.
- Build both sides through one canonical construction and a declared reflection, including boundary maps, derivatives and orientation.

A candidate that keeps the source rows and deforms them is not a replacement. One attempt added 780 KB of source that way and retired no table. Changing the section representation early is the same trap: each new representation spread into joins, caps, normals and sampling, so change it only when a slice shows the existing one cannot carry the law.

## Boundaries

- Reduce independent numbers, never curves. Keep generated curve and section density at or above the current figure; the construction evaluates as many curves as the surface needs. Sparse keys and fixed low control counts lost anatomy each time they were tried.
- Keep a small shape prior when the anatomy needs it: named constants in normalized part coordinates, shared by every person. A table per person, per row or per side is not allowed, and moving or compressing a table is not replacing it.
- Treat every difference from a reference or from master as evidence, never as a target. A large held-out error can reject a law; correcting a coefficient to shrink it is overfitting. Smoother and better curves than master are welcome.
- Make skin smooth through its generating mathematics, with no smoothing pass, clamp, threshold or exclusion after construction.
- Build each anatomical part as an independently deformable module in its own frame under a common body frame, joined to its neighbours by a rule in [Surface composition](../../../packages/human/docs/techniques/surface-composition.md). Reuse the existing skin-joining extension, keep common mathematics in one shared module, and give each shared boundary one owner that its neighbour copies.
- Keep full skin, the normal generation path, rigs, export and other consumers working at every commit. Replacing them with empty or unavailable output is a regression.
- Leave genitals and nipples out of the modelled skin.
- Use meshes and saved Recovery/Hermite curves as observations for rules, judge appearance against the original [photographs](screenshot.md#references), and never treat a ruled reverse-render artifact as an anatomical target.
- Claim no common law or prediction for other people from f1 reproduction alone.
- Write and run no Human or Human-viewer tests except pure-logic unit tests for the facade controller, and never hardcode a test to specific coordinates or output snapshots. The score is a local executable, not a test.
- Acquire further references without asking, by the [reference-experiments README](../../../test/src/executable/reference-experiments/README.md). Generalization says which references help.
- Call the references f1, f2, m1 and m2, or the reference source. The user does not want the generator behind them named in any file, issue, commit or pull request.
- Run no `git clean -x` or `git stash --all` here, and compare a branch's added paths with the disk before switching to it. `test/.shots`, `test/src/executable` and `.shots` are ignored and unrecoverable, and a checkout can overwrite an ignored file without warning.
- Tell the user only what you checked.
