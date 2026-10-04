---
name: viewer-verification
description: Defines visual verification of viewer, render, pose, motion and expression changes, with current-source hardware captures and conditional browser and human-viewer tool usage. Use before claiming those changes work. Numerical tests alone do not establish appearance.
---

# Viewer Verification

Verify a viewer, render, pose, motion or expression change through its actual consumer before reporting that it works. Unit tests establish numerical behavior; inspect the final rendered output to establish appearance. The owning task and product contract define the subject population and acceptance conditions.

## Observe the result

1. Identify the current source, input document and basis, consumer, camera, lighting, pose or timestamp. Capture with a real hardware renderer and record its renderer string and source revision. A stale build, compilation failure or software renderer leaves verification open.
2. Inspect the affected region and its assembled neighbors at useful resolution and viewing distance, in the required views and supported states, including rest, intermediate movement, affected extrema and return; for a form owner the contracts skill's [Rendered Observation](../contracts/modeling.md#rendered-observation) chapter names the complete set. Sample motion between keyframes. Read material and lighting in the delivered beauty pass. To judge shape, use a directional key light that casts the planes, because an even wash makes a broken shape look passable, and flat or normal passes to separate geometry from material; use each structural pass only for the quantity it exposes.
3. Compare the capture with the intended result and the engine's resolved geometry, pose or motion. A mismatch with the engine points to the viewer; agreement with an incorrect result points to the engine or data. Record concrete deviations, refusals, missing views and unobserved regions separately from successful observations.

For quantitative readings, validate the instrument against an independent known case, define the coordinate convention and report uncertainty or measurement error. Calibration and a discriminating counterexample serve that claim; ordinary appearance inspection does not require a calibration frame or mirrored twin.

## Choose the tool

Read [tool usage](tool-usage.md) before using the resident human viewer, a custom Playwright page, pixel calibration or a before/after capture. It owns commands, readiness checks, pass limits and process protection. Reuse another session's viewer without restarting or stopping it. Keep captures local and preserve tracked changes during comparisons.
