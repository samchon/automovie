# Generation

Submit each planned [request](requests.md) once the generated film's prerequisites hold, then inspect and choose its takes. Use the provider and setup that [project context](../production/project-context.md) records, through the service's existing connector, CLI or API.

## Requests

### First path

Before a batch, prove one representative request end to end: the input, the generation, the download and stills extracted from the downloaded file. Choose a case with the intended performance, contacts and identity continuity, and fix its input and integration failures before the batch repeats them.

### Submission

Bind each request to its exact input bytes and source revision, and record it under [media records](../production/media-records.md#records). Check the existing job's state before retrying, because a retry can bill another job, and keep to the adopted cost and quality limits. Keep each finished job's downloaded original apart from its derivatives.

Hosted models screen prompts and inputs for violence, weapons, blood, real people and minors, and under the chosen model's usage policy a refusal can cost a billed job or the account. Write a fight or a stunt as movement and impact, as the screenplay does, and report a beat that is still refused to the user, who may choose another provider or an open model.

## Takes

### Inspection and choice

Generate the number of takes per request that project context records, and choose among them before rewriting a prompt, because takes of one request differ. Where the model offers a draft tier or several outputs per job, choose among cheap drafts, then make the final from the chosen draft by the model's documented path.

Extract stills from the take's file at the spacing [capture](../visual-debugging/capture.md#times) sets, and compare them with the hint's stills at matched times under [comparison](../visual-debugging/comparison.md): first the contacts and outcomes its beats decide, then identity, positions, camera and motion. Choose for fidelity to the screenplay beat and the hint, never for an effect the screenplay did not decide. Leave the take's sound and continuous motion to the user.

Repair a take by its cause:

| Flaw | Repair |
| --- | --- |
| Lost action, identity or causality | Repair the source, the request or the selection |
| A local flaw in an otherwise right take | Repair it under [partial repair](finishing.md#partial-repair) |
| A framing the takes keep losing | Change the hint's camera under [staging](../motion/staging.md) |
| Drifting motion or camera | Set a stricter adherence or shorten the request |

Never hide lost action, identity or causality with a cut. Change the hint's camera within the screenplay's camera entry, because a take follows the hint's framing more closely than the prompt. A longer prompt does not repair drift.

### Placement in time

Place a take in the film by its decoded timestamps and time base, because a nominal frame rate cannot place an action, least of all at a variable rate. Trimming, retiming and rebasing are different operations, and neither a shortest-stream option nor silent padding may hide lost material.

Where an extension returns its input joined to the new part, place only the new part. An edit can return slightly shorter than its input, so measure it, and recheck a new take, trim or speed change against its neighbors.

Choose each take's in and out frames on its own consecutive frames, because the model keeps the hint's timing only approximately, and record them against the take's available frames in its [record](../production/media-records.md#records).

## Handoff

Finish the accepted takes under [finishing](finishing.md), measure their timing and hand them with their source relationships and limits to [assembly](../production/assembly.md).
