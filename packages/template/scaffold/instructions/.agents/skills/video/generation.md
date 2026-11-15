# Generation

Takes are generated after the [video skill](SKILL.md) has chosen the model, planned the requests and written the prompts. Read the provider and setup authority in [project context](../production/project-context.md) and use the selected service's existing connector, CLI or API.

## Prove one path first

Before a batch, prove one representative request end to end on a case with the intended performance, contacts and identity continuity: the input, the generation, the download, and stills extracted from the downloaded file. Fix input or integration causes before multiplying them.

## Submit

Bind each request to its exact input bytes and source revision and record it under [media records](../production/media-records.md#records). Check the existing job state before retrying, since a retry can bill another job, and keep to the adopted cost and quality limits. A transient URL, seed or finished job is not a take: keep the downloaded original apart from its derivatives.

## Inspect and choose

Generate the takes per request that [project context](../production/project-context.md) records, and choose among them before rewriting a prompt, because takes of one request differ and a choice costs less than another round of wording.

Extract stills from the take's file at the spacing [capture](../visual-debugging/capture.md#times) sets and check identity, positions, contacts, camera and motion against the hint's stills at matched times under [comparison](../visual-debugging/comparison.md), first the contacts and outcomes its beats decide. The user judges its sound and its continuous motion.

Choose among takes for fidelity to the screenplay beat and the hint, never for an effect the screenplay did not decide. A take that loses action, identity or causality is repaired at the source, the request or the selection, never hidden by a cut. A framing the takes keep losing is repaired at the hint's camera under [staging](../motion/staging.md), within the screenplay's camera entry, because a take follows the hint's framing more closely than the prompt's words.

## Place takes in time

Map a take's decoded timestamps and time base into the film; a nominal frame rate cannot place an action, especially at variable rates. Trimming, retiming and rebasing are different operations, and a shortest-stream option or silent padding must not hide lost material. [FFmpeg's filters](https://ffmpeg.org/ffmpeg-filters.html) document them.

A new take, trim or speed change requires rechecking its timing against its neighbors.

## Hand off

Measure the accepted takes' actual timing and hand them with their source relationships and limits to [assembly](../production/assembly.md).
