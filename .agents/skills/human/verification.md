# Verification

The viewer finds defects and accepts a candidate, and the [tests](testing.md) confirm it, in the Human skill's [order](SKILL.md#order). A candidate needs both, because numbers alone do not establish a sound human shape and the viewer shows defects no test reads yet. Establish the original 2D curves' placement and form first, then the algorithm's lofting curves, then the realized surface: smooth output cannot repair a wrong defining curve.

## Curves Against The Reference

A part is only as right as the view curves it is lofted from, so complete the curve inspection before correcting its shape. Use the [selection recipes](screenshot.md#selecting-curves-and-parts) to keep the reference visible while inspecting:

1. Every original outline and axis of every source part: `front.pos`, `front.neg`, `side.pos`, `side.neg` and `axis`. Then inspect each available `top.<k>` raw fullness ring, keeping rejected or missing support explicit. Select one curve at a time when its pair or neighbouring curves obscure it. Inspect the front, side and top, then turn through the back and high and low obliques that reveal its depth and endpoints. The curve's view name belongs to its own frame; it is not necessarily the anatomical camera of that name.
2. Chosen groups of curves and parts together against the same reference: a part with its host, children and neighbours sharing a join, such as the head mass with nose and lips, or the trunk with an arm and its palm and digits. Inspect their placement, crossings and continuity in the same frame; separate pictures cannot establish their relationship. Keep the reference clay for front and side silhouettes and its section curves for the top; horizontal reference curves alone can hide the side boundary.
3. The whole figure with all its view curves over the reference, to check proportions and coverage. Whole front, side and top frames are an overview, not a replacement for the individual and grouped readings.

Complete this round for every built part in the task's person scope before shape corrections, because a changed host or frame also changes its neighbours.

The reference comparison observes the production source definition before final realization. Read its `observation`, original `diagnostics` and `sourceRecords`: tree membership, unconnected studies, definition-only parts and unavailable results mean different things. Inspect studies as studies; their visible curves do not prove they belong to the generated skin. `finalRealization: not-run` is no final calibration, join or rig pass. A source with no admitted loft sections can still have original outlines to inspect.

Completing the observation round is not 2D acceptance. Gather every misplaced, malformed, missing or unexplained curve and its cause, correct the original 2D definitions in one batch, and repeat the complete individual and grouped reference comparison until their placement and form hold or each departure has its sourced reason. Only then proceed to the lofting curves and realized-surface inspection; a surface-first repair can conceal the wrong input the algorithm received.

Read the actual matched part and curve ids, briefly enabling labels to establish identity and then hiding them when they obscure the shape. Record missing parts, empty selections and unsupported comparisons explicitly; a palm incorporated in an arm's walk needs inspection there, and an absent digit is not a passed digit. For each curve record the observed departure, its direction and scale where measurable, the camera and reference conditions, and the input, law, frame or construction choice responsible. Use one frozen source for the inspection round and personally open every frame cited.

The deviation is a diagnostic that finds causes, never a target to fit one person. A shape comes from the sources the Human skill's [order](SKILL.md#order) names, with its reason stated in its doc comment as [Numbers](construction.md#numbers) requires, and the comparison judges a curve by that reason. A curve may therefore rightly depart from one reference where its law reads the anatomy differently, such as a calf or wrist girth or the size of the head, breasts or buttocks; the comparison catches the curve whose reason fails, one that leaves the skin absurdly, crosses a neighbour or misplaces its part.

## Inspection Round

Inspect the candidate's generating curves, skin and joins following [Visual Debugging](../3d-modeling/visual-debugging.md), for the affected person and all affected parts, and compare it with the existing figure under matching camera, light, shading, size and renderer conditions in every affected region and join, including changed inputs. Expand to other people when the task requires it. Inspect each selected part alone, then with its host and neighbours, then assembled, using the [selection recipes](screenshot.md#selecting-curves-and-parts); include the realized blends so a hidden blend cannot manufacture a gap. Keep partial work visible with what is unverified marked. Every variable below is a URL variable of the [debug viewer](screenshot.md).

1. View the whole person from every `camera`, once with `curves=none`, once with the curves over the surface and once with `parts=none`, and with `shade=appearance`, in the anatomical neutral, at `pose=bind` and in the supported poses. Check normal human proportions, silhouettes, and missing or disconnected anatomy.
2. View the face with `shade=appearance` and `focus=head*`.
3. View each region and join in close-ups (`focus=<part pattern>`) with `shade=clay` under `light=raking` from `lightSide=left` and `lightSide=right`. Check C2 at shared keys, G2 across strips, and trims against the observed shape.
4. Trace every line or ripple to the curves that make it:
   - Find the skin part `human.skin.<chain>/<k>` that carries it by showing and colouring candidates with `parts` and `partColor`.
   - Select sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` with `curves`, retaining the matched camera from the preceding surface pass.
   - Read the adjoining surface with `shade=curvature` and identify the curves with `labels=1`.
5. Write every finding, with its cause, into the round's findings table.

The reference comparison shows the reference skin and the inputs to lofting, not the generated person's skin. Judge the realized surface in the ordinary person or piece view as well, at the same cameras with surface alone, construction over it and construction alone. A missing or culled surface cannot be accepted from its view curves.

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture the current person with `camera=front`, `left`, `top` and `back`, once with `curves=none` and the underwear hidden by `hide`, and once with the curves; include the developing parts and their actual generating curves.
- Capture a round with the batch route or the capture CLI, which keep each PNG's exact bytes with a receipt of its headers under `packages/human/.shots/`, in a round directory of your own.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop visual claims that depend on it and repair the viewer and capture path first.
