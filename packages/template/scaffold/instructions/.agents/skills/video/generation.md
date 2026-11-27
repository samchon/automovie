# Generation

After meeting generation prerequisites, submit each [request](requests.md) through the adopted provider's connector, CLI or API. Inspect and choose its takes.

## Requests

### First path

Before batching, prove one representative contact, performance and identity case through inputs, generation, download and extracted stills. Fix input and integration failures.

### Submission

Record each request with the exact input bytes and source revision under [media records](../production/media-records.md). Check the existing job before retrying. Respect cost and quality limits and retain downloaded originals separately.

Check the provider's content policy, including refusal billing and account limits. Describe the scripted movement and impact. Report a refused beat for the user's decision on allowed alternatives.

## Takes

### Inspection and choice

<!-- @reference [fal’s clay-render case study](https://blog.fal.ai/from-clay-3d-render-to-a-real-action-short-a-3d-to-ai-pipeline-with-total-control/) describes correcting the framing in the source camera. -->

Generate and compare the recorded number of takes before changing the prompt. If the model supports drafts, choose one and follow its documented path to a final take.

Compare takes with matched hint frames for contacts, outcomes, identity, placement, camera and motion. Before adoption, decode and inspect the intended interval under [capture timing](../visual-debugging/capture.md#times). Have the user judge continuous playback and commissioned sound.

Repair a take by its cause:

| Flaw | Repair |
| --- | --- |
| Lost action, identity or causality | Repair the source, the request or the selection |
| A local flaw in an otherwise right take | Repair it under [partial repair](finishing.md#partial-repair) |
| A framing the takes keep losing | Change the hint's camera under [staging](../motion/staging.md) |
| Drifting motion or camera | Set a stricter adherence or shorten the request |

Preserve action, identity and causality through cuts. Repair framing in the hint's camera within the screenplay entry.

### Placement in time

<!-- @reference The [FFmpeg filter guide](https://ffmpeg.org/ffmpeg-filters.html) covers trim, setpts and fps. -->

Place takes by decoded timestamps and time base. Keep trims, retimes and rebases distinct. Preserve required material when aligning streams. Avoid truncation or silent padding that hides loss.

If an extension returns its input joined to new footage, place only the new footage. Measure every edit. Recheck new takes, trims and speed changes against their neighbors.

Choose in and out frames from the take's consecutive frames. Record them within the available range in its [record](../production/media-records.md#records).

## Handoff

[Finish](finishing.md) the takes and recheck altered intervals and joins. Hand timing, source relationships and limits to assembly.
