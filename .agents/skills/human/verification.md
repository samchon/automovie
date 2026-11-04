# Verification

The viewer finds defects and accepts a candidate, and the [tests](testing.md) confirm it, in the Human skill's [order](SKILL.md#order). A candidate needs both, because numbers alone do not establish a sound human shape and the viewer shows defects no test reads yet.

## Curves Against The Reference

A part is only as right as the view curves it is lofted from, so judge those curves before any surface. Draw the reference figure with every part's view curves and axis over it, each part in its own colour and each curve labelled with its part and view, from the front, side and top, using the view comparison's `reference`, `part`, `referencePart`, `views` and `viewLabels` variables in the [debug README](../../../packages/human/debug/README.md). Then go part by part in close-up and record, for each curve, where it leaves the reference skin, by how much, and which input, law, frame or construction choice put it there.

The deviation is a diagnostic that finds causes, never a target to fit one person. A shape comes from the person's inputs, published or derived laws, and normalized tables derived from the references and aggregated over the whole reference set, and every curve's source states that reason in its doc comment. A curve may therefore rightly depart from one reference where its law reads the anatomy differently, such as a calf or wrist girth or the size of the head, breasts or buttocks; the comparison catches the curve whose reason fails, one that leaves the skin absurdly, crosses a neighbour or misplaces its part.

## Inspection Round

Inspect the candidate's generating curves, skin and joins following [Visual Debugging](../3d-modeling/visual-debugging.md), for the affected person and all affected parts, and compare it with the existing figure under matching camera, light, shading, size and renderer conditions in every affected region and join, including changed inputs. Expand to other people when the task requires it, view a piece alone ([Frames](screenshot.md#frames)) before wiring it, and keep partial work visible with what is unverified marked. Every variable below is a URL variable of the [debug viewer](screenshot.md).

1. View the whole person from every `camera`, once with `curves=none`, once with the curves over the surface and once with `parts=none`, and with `shade=appearance`, in the anatomical neutral, at `pose=bind` and in the supported poses. Check normal human proportions, silhouettes, and missing or disconnected anatomy.
2. View the face with `shade=appearance` and `focus=head*`.
3. View each region and join in close-ups (`focus=<part pattern>`) with `shade=clay` under `light=raking` from `lightSide=left` and `lightSide=right`. Check C2 at shared keys, G2 across strips, and trims against the observed shape.
4. Trace every line or ripple to the curves that make it:
   - Find the skin part `human.skin.<chain>/<k>` that carries it by showing and colouring candidates with `parts` and `partColor`.
   - Show sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` alone with `curves`, and frame them with `focus`.
   - Read their curvature with `shade=curvature` and their names with `labels=1`.
5. Write every finding, with its cause, into the round's findings table.

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture the current person with `camera=front`, `left`, `top` and `back`, once with `curves=none` and the underwear hidden by `hide`, and once with the curves; include the developing parts and their actual generating curves.
- Capture a round with the batch route or the capture CLI, which keep each PNG's exact bytes with a receipt of its headers under `packages/human/.shots/`, in a round directory of your own.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop visual claims that depend on it and repair the viewer and capture path first.
