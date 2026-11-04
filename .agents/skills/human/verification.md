# Verification

The [tests](testing.md) and the score reject, and the viewer accepts. A candidate needs all three, because numbers alone do not establish a sound human shape.

## Score

The score is a set of CPU-only tests that generate the figure without a GPU. They report:

| Measure | Reads | Meaning |
| --- | --- | --- |
| Validity across the parameter domain | every control at both ends of its declared range and combined extremes, declaring a range first where a control has none | Rejects non-finite values, collapsed or self-crossing sections, folds and open joins. |
| Requested against generated dimensions | the input-identity audit ([Testing](testing.md#levels)) | Rejects a parameter with no or the wrong response. |

## Inspection

Inspect a candidate's generating curves, skin and joins in the [viewer](screenshot.md) as soon as the tests and the score admit it, following [Visual Debugging](../3d-modeling/visual-debugging.md).

Compare it with the existing figure under the same conditions in every affected region and join, including changed inputs. Keep partial work visible and mark what is unverified.

View a piece alone ([Frames](screenshot.md#frames)) before wiring it, and the whole figure after.

## Curves Against The Reference

A part is only as right as the view curves it is lofted from, so judge those curves before any surface. Draw the reference figure in the viewer with every part's view curves and axis over it, each part in its own colour and each curve labelled with its part and view, from the front, side and top. Then go part by part in close-up and record, for each curve, where it leaves the reference skin, by how much, and which input, law, frame or construction choice put it there. Fix by those causes in one batch and draw the same close-ups again.

## Inspection Round

Inspect the affected person and all affected parts under matching camera, light, shading, size and renderer conditions, expanding to other people when the task requires it. Every variable below is a URL variable of the [debug viewer](screenshot.md).

1. View the whole person from every `camera`, once with `curves=none`, once with the curves over the surface and once with `parts=none`, and with `shade=appearance`, in the anatomical neutral, at `pose=bind` and in the supported poses. Check normal human proportions, silhouettes, and missing or disconnected anatomy.
2. View the face with `shade=appearance` and `focus=head*`.
3. View each region and join in close-ups (`focus=<part pattern>`) with `shade=clay` under `light=raking` from `lightSide=left` and `lightSide=right`. Check C2 at shared keys, G2 across strips, and trims against the observed shape.
4. Trace every line or ripple to the curves that make it:
   - Find the skin part `human.skin.<chain>/<k>` that carries it by showing and colouring candidates with `parts` and `partColor`.
   - Show sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` alone with `curves`, and frame them with `focus`.
   - Read their curvature with `shade=curvature` and their names with `labels=1`.
5. Write every finding, with its cause, into the round's findings table, and record each that outlives the round in the Human package's documentation.

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture the current person with `camera=front`, `left`, `top` and `back`, once with `curves=none` and the underwear hidden by `hide`, and once with the curves; include the developing parts and their actual generating curves.
- Capture a round with the batch route or the capture CLI, which keep each PNG's exact bytes with a receipt of its headers under `packages/human/.shots/`, in a round directory of your own.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop visual claims that depend on it and repair the viewer and capture path first.
