# Delivery review

Read the commission in [project context](../production/project-context.md) to identify the scope, current inputs and recipient. Use a [separate context](../story/workflow/routes.md#separate-contexts) for required narrative review and for media acceptance. Label any self-review and report unavailable reviews or outputs as unperformed. Inspect the complete commissioned output. Read required validation reports unfiltered after locking any independent recipient reading.

## Output reviews

### Narrative

For [direct writing or a fixed screenplay](../story/workflow/routes.md#who-writes-the-screenplay), check text completeness against the commission and identify the delivered revision. Compare a fixed screenplay verbatim with the supplied text. Record the [handoff](#acceptance-record) without a narrative verdict.

When the route requires narrative passes, lock the first response as a recipient before reading plans or Evidence. Compare setups, consequences, ending, boundaries, promises and duration. Then check the [narrative records](#narrative-records) and record the [handoff](#acceptance-record).

### Video

Lock an audience response to the delivered picture before reading the screenplay or code. Judge a film on stills in two passes.

| Pass | Stills come from | Shows |
| --- | --- | --- |
| Source | The film's source | Pose, contact, staging, camera and timing |
| Artifact | The delivered or generated file | Every scene, raster, transitions, encode and, if generated, the picture |

Use the README's capture commands to draw the source and extract the delivered file at matching times. For generated takes, match by the recorded request intervals, trims and conform mapping. Verify both views of the work before claiming delivery. Apply [measurement and comparison](#measurement-and-comparison) and record [acceptance](#acceptance-record).

Cover the entire film and all joins. Then check every beat, contact, support, facing, reaction, occlusion and continuity in the picture.

Verify staging, identity, camera, action and timing on the adopted representation. Compare a hint's [control channels](../motion/control-channels.md) at matched frames.

A selected generator is judged on its accepted inputs and takes under [generation](../video/generation.md).

A finished direct 3D or generated film is judged by its own picture for preserved action, identity, continuity and audience effect, not by its conditioning, and a direct 3D film also for what [direct film](../video/direct-film.md#what-to-look-for) lists.

Ask the user for what only playback shows, and record each report against its film time so the repair can find the frames.

For a film with narrative passes, check the [narrative records](#narrative-records) after locking the audience response.

### Measurement and comparison

Inspect all review segments on contact sheets. Use consecutive frames around contacts, cuts and joins under [capture](../visual-debugging/capture.md#times). The README defines the capture options.

With motion already accepted in its catalog cases, this pass judges staging, camera and timing under [motion judgment](../motion/judgment.md). Repeat it on every segment a fix touches.

Use [when to study](../story/planning/research.md#when-to-study) to assign research. Measure visible targets on output stills and audible targets on decoded audio. Confirm commissioned sound under [listening](../audio/listening.md).

Measure the delivered file against the [delivery profile](../production/project-context.md#the-delivery-profile). Read its tags and measure frame count. Measure loudness by the recorded method for a film with sound.

Derive runtime from performed and measured timing.

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
- the views and passes reviewed;
- what the user watched or heard, and what nobody did.

Record review observations here, outside [the graph](../contracts/items.md#outside-the-graph).

## Repairs

For a film, confirm that the handoff carries the records required by assembly. Repair media findings through the owners that page names and inspect the affected output again; narrative changes follow [repair](../story/correction/repair.md).
