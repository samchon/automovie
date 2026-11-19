# Delivery review

Read the commission in [project context](../production/project-context.md) to identify the scope, current inputs and recipient. Use a [separate context](../story/workflow/routes.md#separate-contexts) for required narrative review and for media acceptance. Label any self-review and report unavailable reviews or outputs as unperformed. Inspect the complete commissioned output. Read required validation reports unfiltered after locking any independent recipient reading.

## Output reviews

### Narrative

For [direct writing or a fixed screenplay](../story/workflow/routes.md#who-writes-the-screenplay), check text completeness against the commission and identify the delivered revision. Compare a fixed screenplay verbatim with the supplied text. Record the [handoff](#acceptance-record) without a narrative verdict.

When the route requires narrative passes, lock the first response as a recipient before reading plans or Evidence. Compare setups, consequences, ending, boundaries, promises and duration. Then check the [narrative records](#narrative-records) and record the [handoff](#acceptance-record).

When references accompany the text, apply [asset review](#assets) to each commissioned subject and view before closing that delivery.

### Video

Give the independent viewer the commission and the complete candidate at its intended speed. Record what sustained or broke the performance and when, before disclosing planned events, earlier verdicts or repairs. Judge movement, holds, simultaneous action and rhythm across cuts.

| Pass | Stills come from | Shows |
| --- | --- | --- |
| Source | The film's source | Pose, contact, staging, camera and timing |
| Artifact | The delivered or generated file | Every scene, raster, transitions, encode and, if generated, the picture |

Use the README's capture commands to draw the source and extract the delivered file at matching times. For generated takes, match by the recorded request intervals, trims and conform mapping. Verify both views of the work before claiming delivery. Apply [measurement and comparison](#measurement-and-comparison) and record [acceptance](#acceptance-record).

Cover the entire film and its joins. Follow each beat's participants, objects, contacts and reactions through the edit. For a disputed beat, identify the picture, sound or words that conveyed its cause. A viewer can infer a result from a score or caption and still miss an action the picture owes.

Compare a hint's [control channels](../motion/control-channels.md) at matched frames. Judge a direct film under [direct film](../video/direct-film.md#what-to-look-for) and a generated film on its finished takes under [generation](../video/generation.md).

When the reviewer cannot experience continuous playback, get the missing observation from the user or their delegated viewer. Follow [user listening](../audio/listening.md#user-listening) for commissioned sound. Keep the film a review candidate while required observations or defects affecting the commission remain open. Record the decision against the file and film time.

For a film with narrative passes, check the [narrative records](#narrative-records) after locking the audience response.

### Measurement and comparison

Inspect all review segments on contact sheets labeled in elapsed film time. The sampling rate sets the spacing between observations. For a decisive event between samples, inspect consecutive output frames under [capture](../visual-debugging/capture.md#times).

Check that the accepted motion still works with the actual cast, surfaces, partners, camera and edit under [motion judgment](../motion/judgment.md). Recheck affected segments and joins after a repair.

Use [when to study](../story/planning/research.md#when-to-study) to assign research. Measure visible targets on output stills and audible targets on decoded audio. Confirm commissioned sound under [listening](../audio/listening.md).

Measure the file against the [delivery profile](../production/project-context.md#the-delivery-profile), including frame count, presentation times and commissioned sound levels. For a pace finding, time the interval from cue to outcome in the staged action and delivered cut. Compare it with the intended beat and, for skilled practice, the observed exchange. Account for holds, cuts and replays. Repair where the unexplained time first appears.

Keep accepted sheets and measures under [media records](../production/media-records.md#files). Compare each segment at matched times with the previous delivery under [comparison](../visual-debugging/comparison.md). Repair regressions or obtain the owner's acceptance.

### Assets

For commissioned [appearance references](../image/canon-references.md), open every promised view from its subject record. Check it against the description and record which views the user accepted.

For a visual asset, test promised views and controls in its consumer. Check shape, contact, deformation and movement where they apply under [form inspection](../3d-modeling/inspection.md) and [commissioned uses](../development/entities.md#inspection-and-handoff).

For audio, follow [listening](../audio/listening.md). Record the applicable checks with the [asset handoff](#acceptance-record).

## Narrative records

Confirm the required passes' [closure](../story/workflow/routes.md#completion). For stages still enabled, the delivery reviewer checks current bodies, contracts and answers. Verify closed passes from their reviews and available validation results under [closed-pass rules](../story/correction/repair.md#closed-passes). Limit pilots to the inspected slice.

These records are for delivery review. The [independent narrative reader](independent-reading.md#reading-as-the-recipient) receives the body without author answers.

## Acceptance record

Record the revision, output identities, checks, observations and remaining limits. Keep this record with the handoff for a screenplay-only delivery or standalone asset.

For a film or whole motion hint, keep one `docs/acceptance/<film>.md` across revisions. Include:

- technical file completion;
- the separate verdict on the depicted practice;
- rejected requirements and any exclusion the user adopted;
- the checklist: every scene and beat seen, on-model entities, contacts, presences, camera and continuity;
- the measures;
- the exact candidate identifier, who examined frames and who watched or listened at normal speed;
- contrary observations with their times, disposition and any open repair, and the director's decision for this cut.

A retake check establishes only the interval examined. Use the current whole-film decision for delivery or promotion. Cite the observation that resolves any disagreement affecting the commission. A withdrawn cut keeps its historical record and loses its approval for delivery.

Record review observations here, outside [the graph](../contracts/items.md#outside-the-graph).

## Repairs

Trace a failed exchange from the delivered cut through staging and the module to the written beat and its study. If the written beat would produce the defect even when faithfully staged, send it to the writer. Repair the earliest cause and apply the [video decision](#video) to the rebuilt candidate.
