# Delivery review

Identify the commissioned output, revision and recipient from [project context](../production/project-context.md). Inspect the complete output. Use a [separate context](../story/workflow/routes.md#separate-contexts) for required narrative review and media acceptance. Label self-review and any checks that could not be performed.

## Output reviews

### Narrative

For [direct writing or fixed text](../story/workflow/routes.md#who-writes-the-screenplay), check completeness and compare fixed text verbatim with the supplied revision. Record the handoff without a narrative verdict.

Where narrative passes apply, lock the recipient's first reading before consulting plans or Evidence. Check setups, consequences, ending, promises and duration, then verify the [narrative records](#narrative-records). Review commissioned references under [assets](#assets).

### Video

Give the independent viewer the commission and complete candidate at its intended speed. Before disclosing plans or repairs, record where movement, stillness, simultaneous action or a cut sustained or broke the performance. For a disputed beat, identify the picture, sound or words that conveyed its cause. A score or caption can reveal the result while the action remains unreadable.

For a narrative, record what the opening led the viewer to expect, what they knew when a choice or reveal landed, and what the ending delivered. A sequence of convincing beats can still leave a payoff without its setup.

If the reviewer cannot watch continuous playback, obtain that observation from the user or their delegated viewer. For commissioned sound, follow [user listening](../audio/listening.md#user-listening). Keep the cut a candidate while a required observation or material defect remains open.

Check a motion hint's [control channels](../motion/control-channels.md), a [direct film's finish](../video/direct-film.md#what-to-look-for) or the [generated takes](../video/generation.md) as commissioned. Check [narrative records](#narrative-records) after the independent viewing when those passes apply.

### Measurement and comparison

Read the production diagnostics the README describes in every inspection round and render, and repair their findings with the round's other findings. The cut stays a candidate while the render blocks publication. Use the README's capture commands to compare source and delivered frames across every scene and join. Label sheets in elapsed film time. Map generated takes by their request intervals, trims and conform. Inspect [consecutive output frames](../visual-debugging/capture.md#times) when the event falls between samples.

Follow participants, props and contacts through the edit under [motion judgment](../motion/judgment.md). For a pace finding, time the interval from cue to outcome in the staging and the delivered cut. For skilled practice, compare it with the observed exchange. Account for holds, cuts and replays.

Compare each release unit and the assembled running time with the commission. Trace a shortfall to the performed action, recorded speech or edit. Locate any promised event missing from the cut.

Verify the [delivery profile](../production/project-context.md#the-delivery-profile) on the assembled file, including raster, frame count, presentation times and commissioned audio levels. Measure picture targets on output frames and sound targets on decoded audio. Compare revisions at [matching times](../visual-debugging/comparison.md). Keep accepted sheets and measurements under [media records](../production/media-records.md#files). Repair regressions or obtain the owner's acceptance.

### Assets

Open each commissioned [appearance reference](../image/canon-references.md) from its subject record, compare it with the description and record which views the user accepted.

Test visual assets in their [commissioned use](../development/entities.md#inspection-and-handoff), including promised views and controls. Inspect shape, contact, deformation and movement under [form inspection](../3d-modeling/inspection.md) where applicable. For audio, follow [listening](../audio/listening.md).

## Narrative records

For open passes, check current bodies, contracts and answers under [route completion](../story/workflow/routes.md#completion). For closed passes, report the revision covered by their reviews and available validation results under [closed-pass rules](../story/correction/repair.md#closed-passes). Read required reports unfiltered after the independent reading. Limit a pilot verdict to its inspected slice.

## Acceptance record

For text or a standalone asset, include the revision, checks, observations and remaining limits in the handoff. For a film or whole motion hint, keep one `docs/acceptance/<film>.md` across revisions. Record:

- the exact candidate and the scenes, beats, subjects, contacts, views and joins examined;
- who examined frames, who watched or listened at normal speed, and what each observed;
- the measurements, technical result and separate judgment on the depicted practice;
- disputed findings and their times, the evidence resolving them, and any open repairs or user-approved exclusions;
- the director's decision on that cut.

When a handoff uses a verification stage, agree its scope and required checks with the director before editing the stage. Read the required evidence with `pnpm run verify --subject <id> --require <stage>`. Link the selected capture or delivery reports, measurements and review receipts that informed the decision for the exact candidate and scope. If the director revises a review, point the check and the acceptance record at the replacement receipt and keep the earlier decision in the history.

A retake verdict covers the interval checked. Promote only a cut with current whole-film approval. Retain withdrawn decisions as history. Keep these observations [outside the contract graph](../contracts/items.md#outside-the-graph).

## Repairs

From the first playable draft through delivery, give the director the affected passage, its film time and what the viewer saw or heard. On a published file, use `automovie review --file <video> --at <seconds> --note <text>` to mark that version. Reopen its frame and adjacent stills with `automovie review --mark <review.json>`. Keep the needed original file or clip with the accepted observations. If a retake moved or removed the passage, use the current file and an explicit new time to rebind only when the affected passage is known. Compare the performance, framing and edit with the current screenplay. Where the production obscures or changes the intended action, correct it and replay the passage.

If the passage plays as written and the story still fails, the director gives the writer the observed loss to trace to its [earliest story decision](../story/correction/repair.md#upstream-defects). Changes to [user-fixed text](../story/workflow/routes.md#fixed-screenplay) go to the user. If a missing story decision prevents staging, follow [concretization](../story/correction/repair.md#concretization).

Stage the affected passages and recheck their joins. Review the rebuilt candidate in order to verify the original loss is resolved before approval.
