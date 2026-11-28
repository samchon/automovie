# Delivery review

Inspect the complete current output against the [commission](../production/project-context.md). Assign [independent review](../story/workflow/routes.md#separate-contexts) when required. Label self-review and unavailable checks.

## Output reviews

### Narrative

For [direct writing or fixed text](../story/workflow/routes.md#who-writes-the-screenplay), check completeness and compare fixed text verbatim with the supplied revision. Record the handoff without a narrative verdict.

Where narrative passes apply, lock the recipient's first reading before consulting plans or Evidence. Check setups, consequences, ending, promises, duration, narrative records and commissioned references.

### Video

As the independent viewer, watch the exact complete cut continuously at 1×. Record audience cues and losses before reading plans or repair notes. For a disputed beat, identify what conveyed its cause and whether the picture made the action readable.

For a narrative, record what the opening promises, what the audience knows at each choice or reveal, and what the ending delivers. Check each payoff against its setup.

Ask the user or their delegate for unavailable playback observations. Use [user listening](../audio/listening.md#user-listening) for sound. Keep the cut pending until required observations and repairs are complete.

Check the commissioned [hint channels](../motion/control-channels.md), [direct film finish](../video/direct-film.md#what-to-look-for) or generated takes. On routes with narrative passes, check their records after the independent viewing.

#### Decoded frame review

Decode the exact candidate under the [capture timing rules](../visual-debugging/capture.md#times). Follow every visible actor in presentation order on frames or labeled sheets. Open full-size frames for unclear details.

Record frame indices, times, observations and every defect in each window, including slight unnatural motion or reactions. Acceptance requires these findings and separate continuous 1× viewing.

### Measurement and comparison

Compare source and delivery across scenes and joins with README diagnostics and captures. Label sheets in film time. Map takes by request interval, trim and conform.

Open cited studies after first viewing. Check the exported beats, actors, props and contacts in the [delivery camera](../motion/staging.md#the-view). For pace findings, time cue to outcome in source and delivery.

Compare each release unit and the assembled running time with the commission. Trace a shortfall to the performed action, recorded speech or edit. Locate any promised event missing from the cut.

Verify the assembled file's [delivery profile](../production/project-context.md#the-delivery-profile), including raster, frame count, presentation times and commissioned audio levels. Measure picture on output frames and sound on decoded audio. Compare revisions at [matching times](../visual-debugging/comparison.md). Keep accepted sheets and measurements under [media records](../production/media-records.md#files). Repair regressions or obtain the owner's acceptance.

### Assets

Open each commissioned [appearance reference](../image/canon-references.md) from its subject record, compare it with the description and record which views the user accepted.

Test visual assets in the commissioned use, including promised views and controls. Inspect shape, contact, deformation and movement under [form inspection](../3d-modeling/inspection.md) where applicable. For audio, follow [listening](../audio/listening.md).

## Narrative records

For open passes, check current bodies, contracts and answers under [route completion](../story/workflow/routes.md#completion). For closed passes, report the revision covered by their reviews and available validation results under [closed-pass rules](../story/correction/repair.md#closed-passes). Read required reports unfiltered after the independent reading. Limit a pilot verdict to its inspected slice.

## Acceptance record

For text or a standalone asset, include the revision, checks, observations and remaining limits in the handoff. For a film or whole motion hint, keep one `docs/acceptance/<film>.md` across revisions. Record:

- Candidate revision, scenes, beats, actors, views, contacts and joins reviewed
- Frame reviewer, cadence, sheets and findings
- 1× viewer or listener and observations
- Technical results and judgment of depicted practice
- Disputed findings, times, resolutions and open repairs or approved exclusions
- The director's decision on that cut

At handoff, run and record the [required production checks](../production/checks.md).

Limit retake verdicts to the interval checked. Promote only a cut with current whole-film approval. Retain withdrawn decisions as history. Keep observations [outside the contract graph](../contracts/items.md#outside-the-graph).

### Passage observations

Start the acceptance record with the [first programming assignment](../production/director.md#first-programming-assignment). Name the subject or candidate, intended interval and view. After capture or playback, add the exact source or file, observed frames or seconds, viewing mode, witness and remaining questions. Mark planned, partial and complete coverage by their recorded extent.

A diagnostic view can locate a successful transfer whose cause the delivery camera hides. Record those physical and screen observations separately. Keep the pace judgment pending until the passage plays at speed. Give the independent viewer the exact complete cut and collect the first reading under [Video](#video).

Count the outcome of each commissioned first candidate once. Keep agreed-scope corrections, other requests, pending review and absent candidates visible separately. Include the number of candidates and requests, elapsed time and any recorded cost. Preserve the observation and decision for a replaced candidate as history.

## Repairs

Send the repair owner the exact passage, time or frame, failed criterion and observed loss.

Mark a published version with `automovie review --file <video> --at <seconds> --note <text>`. Preserve the marked artifact and reopen with `automovie review --mark <review.json>`. Rebind only to a known time in the current file.

If the passage plays as written, route story defects to the [earliest decision](../story/correction/repair.md#upstream-defects). Refer [user-fixed text](../story/workflow/routes.md#fixed-screenplay) to the user. Return missing staging decisions under [concretization](../story/correction/repair.md#concretization).

Replay the repair and its joins against the screenplay. Inspect the rebuilt cut before approval.
