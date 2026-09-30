# Human Package

Read this document before you change or investigate `packages/human` (the face and body editors). The package [README](../../../packages/human/README.md) owns package use, and the linked requirements and specifications own the product promises.

## Types first

Design the parameter types first. Complete the anatomical type vocabulary (components, measurements, ranges, and the conversions between simple and detailed inputs) before attaching logic to it, and run experiments against the finished types. Logic attached to an unfinished vocabulary is rewritten each time the vocabulary moves.

## Contracts

Every declaration in the package answers the [contracts skill](../contracts/SKILL.md): common, modeling and anatomical chapters, with the science written in JSDoc. The package cites no requirement or specification page. The facial-authoring and body-authoring pages under `docs/` remain product documents that its source does not cite, and the [evidence graph skill](../evidence-graph/SKILL.md) lists the package as outside the triangle.

## Observe part by part

A declaration that owns a part, a joint or an assembly answers the contracts skill's [Rendered Observation](../contracts/modeling.md#rendered-observation) chapter. This section names the units and their sources.

- **Parts.** Enumerate them from their owners: the body's `AutoMovieHumanBodyPartId` and the surface groups under `body/anatomy/surface`, the face's `IAutoMovieHumanFaceComponentTree` and the regions under `face/anatomy`. Keep no second list.
- **Joints.** Observe two parts joined by a rig articulation as assembled, at the extremes of both, because an opening seam appears only there.
- **Whole.** Observe proportion, mass and the reference poses last, after the parts and joints, because they couple every part.
- **Views.** Take the directions the [facial review contract](../../../docs/specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review) requires: front, anatomical left and right oblique and profile, back, and a material-independent clay. The body uses the same directions.
- **Shared basis.** A change to a shared basis reaches every part built on it, so observe each of them again. An answer written before the change no longer describes the result.
- **Locality.** Renders and reference images stay on the local machine, in `.shots/` or the `.wiki/`. The answer and the issue describe them in words.
- **Body tool.** `test/scripts/body-review/observe-body.ts <name> --unit part|joint|whole [--id <unit id>]` derives these units from their owners (the displayed parts, the rig's joints with their clinical ranges, the standard whole-body states) and draws them, writing a local sheet and a `manifest.json` per unit (revision, basis id, renderer, per-frame SHA-256, the states the editor refused and the extremes the rig does not admit, no image bytes). A manifest whose revision or basis is no longer current is stale, and an answer written from it no longer describes the result. The tool draws what the rig admits and records what it refuses; whether a frame is right is still read by eye.

Drive the viewer as the [viewer-verification skill](../viewer-verification/SKILL.md) describes.

## Investigate a face

Use this procedure for numerical facial shape, expression, skin, hair and their shared attachments. It is a development procedure and grants no likeness approval or new anatomical capability.

### Establish the actual state

Read the README, the linked requirements and specifications, the task's issue and latest pull-request chronology, and the selected numerical documents with their artifact-specific reviews. Apply the user's current scope, because an older issue description or historical review never overrides a later instruction.

Record the source revision, local modifications, document and reference identities, runtime, actual export, renderer, camera, lighting and expression. Resolve the gallery's selected artifact instead of assuming the newest directory or an old screenshot represents current source. Separate authored observations from estimated hidden geometry, and source colour from illumination.

### Diagnose the whole face before editing

Inspect the complete requested subject population in every view the [facial review contract](../../../docs/specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review) requires, together with the expressions the task affects, and use the [viewer-verification skill](../viewer-verification/SKILL.md) to render. Finish this pass before correcting any symptom. A missing view or untested expression is a named coverage gap and not a passing observation.

Collect observations in the task's issue or working knowledge base. Each carries a stable artifact and view locator, the expected result, the measured or visible deviation, the affected anatomical group, a confidence, and any known counterexample. Record a suspected cause apart from a reproduced one, and keep unfavorable measurements and rejected candidates with the reason for rejection.

Group observations by shared cause and consequence. Trace the real path from document resolution through host formation, component fitting, shared boundary construction, subdivision, surface shaping, contact, interior construction, export and display, and find the first stage at which each invariant stops holding. A valid scalar input or named feature does not prove the required combined shape is representable.

### Repair the cause group

Before implementing, write the group's shared constraints and acceptance conditions together, including what must improve and what must stay true in neighboring parts, other subjects and expressions. The oral group considers aperture shape, enamel placement, enclosure and performed contact together. The ocular group considers globe identity, wet aperture, tissue sections, skin attachment and gaze together.

Choose the owner of every boundary, coordinate transform and formula. Distinguish a representation deficiency from a wrong measurement, a bad parameter selection, an incorrect assembly order and a renderer discrepancy, and replace a deficient representation at its owning layer. A larger parameter search or higher tessellation cannot supply a missing degree of freedom.

Implement in small reviewable commits that each stay accountable to the group's joint conditions and account for the side effects already observed, before they become the next visible failure.

### Run discriminating experiments

State the hypothesis, the competing explanation, the fixed quantities, the changed quantity and the rejection condition before the experiment. Use a small independent analytic case first, then the real consumer, then the affected subjects. When several quantities change, describe a structural comparison and do not call it a single-variable A/B. Experiments driven through an authoring agent also follow the [experiment skill](../experiment/SKILL.md).

Measure the assembled surface the renderer receives, and not only a pre-subdivision cage or a copied formula. Test the measurement against an independent known case and state its uncertainty: landmark detections, finite collision samples, triangle-normal angles and thresholded masks answer different questions. A lower residual in one proxy establishes neither geometric validity nor likeness.

When an experiment reveals a new coupled defect, update the group's diagnosis and joint conditions before the next correction. Do not adopt a candidate because its primary metric improved. A repeated failure class calls for revisiting its representation or constraint owner and not for another unbounded loop over scalar values.

### Integrate and hand off

After a repair, validate the joint conditions against the same population, views and expression states, and rebuild derivatives whose source basis changed. Preserve caller-owned data, and verify the normal, invalid and recovery paths through the real document, editor and export consumers. Numerical admission, deterministic replay, capture completeness, direct inspection and likeness are distinct outcomes.

The [review skill](../review/SKILL.md) owns Self-Review and the [pull-request skill](../pull-request/SKILL.md) owns publication and merge gates. A complete observation pass is not a Self-Review.

A handoff states what is established, what is only a hypothesis, what failed, what has not been inspected, and the first action the next session takes. It includes source and artifact locators, reproduction commands, the current revision's check results and the user's preserved constraints. Put enough primary observations in the issue for a new checkout to understand the problem, and name local-only data with its recovery path.
