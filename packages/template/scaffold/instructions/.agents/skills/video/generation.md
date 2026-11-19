# Generation

Submit each planned [request](requests.md) once the generated film's prerequisites hold, then inspect and choose its takes. Use the provider and setup that [project context](../production/project-context.md) records, through the service's existing connector, CLI or API.

## Requests

### First path

Before batching, prove one representative contact, performance and identity case through inputs, generation, download and extracted stills. Fix input and integration failures.

### Submission

Record each request with the exact input bytes and source revision under [media records](../production/media-records.md). Check the existing job before retrying. Respect cost and quality limits and retain downloaded originals separately.

Check the provider's content policy, including refusal billing and account limits. Describe the scripted movement and impact. Report a refused beat for the user's decision on allowed alternatives.

## Takes

### Inspection and choice

Generate the recorded number of takes and choose among them before changing the prompt. Where supported, choose among drafts and follow the model's documented path to a final take.

Compare [extracted stills](../visual-debugging/capture.md#times) with matched hint frames under [comparison](../visual-debugging/comparison.md). Check contacts and outcomes first, then identity, placement, camera and motion. Choose for fidelity to the beat. Have the user judge playback and any commissioned sound.

Repair a take by its cause:

| Flaw | Repair |
| --- | --- |
| Lost action, identity or causality | Repair the source, the request or the selection |
| A local flaw in an otherwise right take | Repair it under [partial repair](finishing.md#partial-repair) |
| A framing the takes keep losing | Change the hint's camera under [staging](../motion/staging.md) |
| Drifting motion or camera | Set a stricter adherence or shorten the request |

Preserve action, identity and causality through cuts. Repair framing in the hint's camera within the screenplay entry.
<!-- @source [fal’s clay-render case study](https://blog.fal.ai/from-clay-3d-render-to-a-real-action-short-a-3d-to-ai-pipeline-with-total-control/) describes correcting the framing in the source camera. -->

### Placement in time

Place takes by decoded timestamps and time base. Keep trims, retimes and rebases distinct. Preserve required material when aligning streams. Avoid truncation or silent padding that hides loss.
<!-- @source The [FFmpeg filter guide](https://ffmpeg.org/ffmpeg-filters.html) covers trim, setpts and fps. -->

Where an extension returns its input joined to the new part, place only the new part. An edit can return slightly shorter than its input, so measure it, and recheck a new take, trim or speed change against its neighbors.

Choose each take's in and out frames on its own consecutive frames, because the model keeps the hint's timing only approximately, and record them against the take's available frames in its [record](../production/media-records.md#records).

## Handoff

Finish the accepted takes under [finishing](finishing.md), measure their timing and hand them with their source relationships and limits to [assembly](../production/assembly.md).
